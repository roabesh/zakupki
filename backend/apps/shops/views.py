import yaml
from decimal import Decimal
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiResponse, inline_serializer, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from rest_framework import serializers as drf_serializers

from apps.products.services import load_price_from_url, load_price_from_file, import_price
from apps.products.models import ProductInfo
from .models import Shop, ShopOrder
from .serializers import ShopSerializer, PartnerStateSerializer


def _compute_composite_state(order):
    """Вычисляет общий статус заказа на основе статусов всех поставщиков."""
    states = list(ShopOrder.objects.filter(order=order).values_list('state', flat=True))
    if not states:
        return order.state  # нет ShopOrder — используем текущий статус

    active = [s for s in states if s != 'cancelled']
    if not active:
        return 'cancelled'

    priority = {'new': 0, 'confirmed': 1, 'assembled': 2, 'sent': 3, 'delivered': 4}

    if all(s == 'delivered' for s in active):
        return 'delivered'
    if all(s in ('sent', 'delivered') for s in active):
        return 'sent'
    if any(s in ('sent', 'delivered') for s in active):
        return 'partially_sent'
    return min(active, key=lambda s: priority.get(s, 0))


class ShopListView(APIView):
    """Список активных магазинов."""

    permission_classes = []  # доступно без авторизации

    @extend_schema(
        responses={200: ShopSerializer(many=True)},
        summary='Список магазинов',
        tags=['Каталог'],
    )
    def get(self, request):
        shops = Shop.objects.filter(state=True)
        serializer = ShopSerializer(shops, many=True)
        return Response(serializer.data)


class PartnerUpdateView(APIView):
    """Загрузка/обновление прайса поставщика."""

    @extend_schema(
        request=inline_serializer('PartnerUpdateRequest', fields={
            'url': drf_serializers.URLField(required=False, help_text='URL YAML-файла с прайсом'),
            'file': drf_serializers.FileField(required=False, help_text='Загружаемый YAML-файл'),
        }),
        responses={
            200: inline_serializer('PartnerUpdateResponse', fields={
                'status': drf_serializers.CharField(),
                'shop': drf_serializers.CharField(),
                'created': drf_serializers.IntegerField(),
                'updated': drf_serializers.IntegerField(),
            }),
            202: inline_serializer('PartnerUpdateAccepted', fields={
                'status': drf_serializers.CharField(),
                'task_id': drf_serializers.CharField(),
            }),
            400: OpenApiResponse(description='Ошибка формата или данных'),
            403: OpenApiResponse(description='Только для поставщиков'),
        },
        summary='Загрузить прайс',
        tags=['Партнёр'],
    )
    def post(self, request):
        # Только поставщики могут загружать прайс
        if request.user.type != 'supplier':
            return Response(
                {'error': 'Только поставщики могут загружать прайс'},
                status=status.HTTP_403_FORBIDDEN,
            )

        url = request.data.get('url')
        file = request.FILES.get('file')

        if not url and not file:
            return Response(
                {'error': 'Необходимо указать url или загрузить файл'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            if url:
                # Загрузка по URL выполняется асинхронно через Celery
                from tasks.import_tasks import import_price_from_url_task
                task = import_price_from_url_task.delay(url, request.user.id)
                return Response(
                    {'status': 'accepted', 'task_id': task.id},
                    status=status.HTTP_202_ACCEPTED,
                )
            else:
                # Загрузка файла — выполняется синхронно
                data = load_price_from_file(file)
                result = import_price(data, request.user)
                return Response(result)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class PartnerStateView(APIView):
    """Получение и изменение статуса приёма заказов."""

    @extend_schema(
        responses={200: PartnerStateSerializer, 403: OpenApiResponse(description='Только для поставщиков')},
        summary='Получить статус магазина',
        tags=['Партнёр'],
    )
    def get(self, request):
        if request.user.type != 'supplier':
            return Response(
                {'error': 'Только для поставщиков'},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            shop = request.user.shop
        except Shop.DoesNotExist:
            return Response({'error': 'Магазин не найден'}, status=status.HTTP_404_NOT_FOUND)

        serializer = PartnerStateSerializer(shop)
        return Response(serializer.data)

    @extend_schema(
        request=PartnerStateSerializer,
        responses={200: PartnerStateSerializer, 403: OpenApiResponse(description='Только для поставщиков')},
        summary='Изменить статус магазина',
        tags=['Партнёр'],
    )
    def put(self, request):
        if request.user.type != 'supplier':
            return Response(
                {'error': 'Только для поставщиков'},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            shop = request.user.shop
        except Shop.DoesNotExist:
            return Response({'error': 'Магазин не найден'}, status=status.HTTP_404_NOT_FOUND)

        serializer = PartnerStateSerializer(shop, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PartnerOrdersView(APIView):
    """Список заказов поставщика + смена статуса."""

    @extend_schema(
        summary='Заказы поставщика',
        tags=['Партнёр'],
    )
    def get(self, request):
        if request.user.type != 'supplier':
            return Response(
                {'error': 'Только для поставщиков'},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            shop = request.user.shop
        except Shop.DoesNotExist:
            return Response({'error': 'Магазин не найден'}, status=status.HTTP_404_NOT_FOUND)

        from apps.orders.models import Order
        from apps.orders.serializers import OrderSerializer

        orders = list(
            Order.objects.filter(
                order_items__product_info__shop=shop,
            )
            .exclude(state='basket')
            .distinct()
            .prefetch_related(
                'order_items__product_info__product',
                'order_items__product_info__shop',
            )
        )

        serializer = OrderSerializer(orders, many=True)

        # Подгружаем ShopOrder для этого поставщика (один запрос)
        shop_order_map = {
            so.order_id: so.state
            for so in ShopOrder.objects.filter(order__in=orders, shop=shop)
        }

        result = []
        for order_obj, order_data in zip(orders, serializer.data):
            d = dict(order_data)
            # Показываем статус этого поставщика, а не общий
            d['state'] = shop_order_map.get(d['id'], d['state'])
            # Оставляем только товары этого поставщика
            pi_ids = set(
                order_obj.order_items.filter(product_info__shop=shop)
                .values_list('product_info_id', flat=True)
            )
            items = [i for i in d['order_items'] if i['product_info']['id'] in pi_ids]
            d['order_items'] = items
            # Пересчитываем сумму
            d['total_sum'] = str(sum(
                Decimal(str(i['product_info']['price_rrc'])) * i['quantity']
                for i in items
            ))
            result.append(d)

        return Response(result)

    @extend_schema(
        request=inline_serializer('PartnerOrderStatusRequest', fields={
            'id': drf_serializers.IntegerField(),
            'state': drf_serializers.ChoiceField(
                choices=['confirmed', 'assembled', 'sent', 'delivered', 'cancelled']
            ),
        }),
        summary='Изменить статус заказа (поставщик)',
        tags=['Партнёр'],
    )
    def put(self, request):
        """Поставщик меняет статус своей части заказа."""
        if request.user.type != 'supplier':
            return Response({'error': 'Только для поставщиков'}, status=status.HTTP_403_FORBIDDEN)

        try:
            shop = request.user.shop
        except Shop.DoesNotExist:
            return Response({'error': 'Магазин не найден'}, status=status.HTTP_404_NOT_FOUND)

        from apps.orders.models import Order
        from apps.orders.serializers import OrderSerializer

        order_id = request.data.get('id')
        new_state = request.data.get('state')

        # Поставщик может переводить только в разрешённые статусы
        allowed_states = ['confirmed', 'assembled', 'sent', 'delivered', 'cancelled']
        if new_state not in allowed_states:
            return Response(
                {'error': f'Недопустимый статус. Доступны: {allowed_states}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            order = Order.objects.filter(
                id=order_id,
                order_items__product_info__shop=shop,
            ).distinct().get()
        except Order.DoesNotExist:
            return Response({'error': 'Заказ не найден'}, status=status.HTTP_404_NOT_FOUND)

        # Обновляем статус конкретного поставщика
        shop_order, _ = ShopOrder.objects.get_or_create(
            order=order,
            shop=shop,
            defaults={'state': 'new'},
        )
        shop_order.state = new_state
        shop_order.save(update_fields=['state'])

        # Пересчитываем общий статус заказа
        order.state = _compute_composite_state(order)
        order.save(update_fields=['state'])

        # Уведомляем покупателя (не блокируем если брокер недоступен)
        try:
            from tasks.email_tasks import send_status_notification_task
            send_status_notification_task.delay(order.id)
        except Exception:
            pass

        # Возвращаем заказ с состоянием именно этого поставщика
        serializer = OrderSerializer(order)
        data = dict(serializer.data)
        data['state'] = new_state  # показываем shop-state, а не composite
        pi_ids = set(
            order.order_items.filter(product_info__shop=shop)
            .values_list('product_info_id', flat=True)
        )
        items = [i for i in data['order_items'] if i['product_info']['id'] in pi_ids]
        data['order_items'] = items
        data['total_sum'] = str(sum(
            Decimal(str(i['product_info']['price_rrc'])) * i['quantity']
            for i in items
        ))
        return Response(data)


class PartnerOrderDetailView(APIView):
    """Детали конкретного заказа поставщика."""

    @extend_schema(
        summary='Детали заказа поставщика',
        tags=['Партнёр'],
    )
    def get(self, request, pk):
        if request.user.type != 'supplier':
            return Response({'error': 'Только для поставщиков'}, status=status.HTTP_403_FORBIDDEN)

        try:
            shop = request.user.shop
        except Shop.DoesNotExist:
            return Response({'error': 'Магазин не найден'}, status=status.HTTP_404_NOT_FOUND)

        from apps.orders.models import Order
        from apps.orders.serializers import OrderSerializer

        try:
            order = (
                Order.objects.prefetch_related(
                    'order_items__product_info__product',
                    'order_items__product_info__shop',
                    'order_items__product_info__product_parameters__parameter',
                    'contact',
                )
                .exclude(state='basket')
                .distinct()
                .get(pk=pk, order_items__product_info__shop=shop)
            )
        except Order.DoesNotExist:
            return Response({'error': 'Заказ не найден'}, status=status.HTTP_404_NOT_FOUND)

        serializer = OrderSerializer(order)
        data = dict(serializer.data)

        # Показываем статус именно этого поставщика
        try:
            data['state'] = ShopOrder.objects.get(order=order, shop=shop).state
        except ShopOrder.DoesNotExist:
            pass

        # Оставляем только позиции текущего поставщика
        shop_pi_ids = set(
            order.order_items.filter(product_info__shop=shop)
            .values_list('product_info_id', flat=True)
        )
        supplier_items = [
            item for item in data['order_items']
            if item['product_info']['id'] in shop_pi_ids
        ]
        data['order_items'] = supplier_items

        # Пересчитываем сумму только по своим позициям
        total = sum(
            Decimal(str(item['product_info']['price_rrc'])) * item['quantity']
            for item in supplier_items
        )
        data['total_sum'] = str(total)

        return Response(data)


class PartnerExportView(APIView):
    """Экспорт текущего прайса поставщика в формате YAML."""

    @extend_schema(
        responses={
            200: OpenApiResponse(description='YAML-файл с прайсом', response=OpenApiTypes.BINARY),
            403: OpenApiResponse(description='Только для поставщиков'),
            404: OpenApiResponse(description='Магазин не найден'),
        },
        summary='Экспорт прайса',
        tags=['Партнёр'],
    )
    def get(self, request):
        if request.user.type != 'supplier':
            return Response(
                {'error': 'Только для поставщиков'},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            shop = request.user.shop
        except Shop.DoesNotExist:
            return Response({'error': 'Магазин не найден'}, status=status.HTTP_404_NOT_FOUND)

        product_infos = (
            ProductInfo.objects.filter(shop=shop)
            .select_related('product__category')
            .prefetch_related('product_parameters__parameter')
        )

        # Собираем уникальные категории
        categories = {}
        goods = []

        for pi in product_infos:
            cat = pi.product.category
            if cat.id not in categories:
                categories[cat.id] = {'id': cat.id, 'name': cat.name}

            parameters = {
                pp.parameter.name: pp.value
                for pp in pi.product_parameters.all()
            }

            goods.append({
                'id': pi.external_id,
                'category': cat.id,
                'model': pi.model,
                'name': pi.product.name,
                'price': float(pi.price),
                'price_rrc': float(pi.price_rrc),
                'quantity': pi.quantity,
                'parameters': parameters,
            })

        export_data = {
            'shop': shop.name,
            'categories': list(categories.values()),
            'goods': goods,
        }

        yaml_content = yaml.dump(
            export_data,
            allow_unicode=True,
            default_flow_style=False,
            sort_keys=False,
        )

        response = HttpResponse(yaml_content, content_type='application/x-yaml')
        response['Content-Disposition'] = f'attachment; filename="{shop.name}_price.yaml"'
        return response
