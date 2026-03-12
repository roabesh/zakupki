from django.db import IntegrityError
from django.conf import settings
from django.core.mail import send_mail
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiResponse, inline_serializer
from rest_framework import serializers as drf_serializers

from apps.products.models import ProductInfo
from .models import Order, OrderItem, Contact
from .serializers import OrderSerializer, ContactSerializer


class BasketView(APIView):
    """
    Корзина покупателя.
    GET — текущая корзина,
    POST — добавить позиции,
    PUT — обновить количество,
    DELETE — удалить позиции.
    """

    permission_classes = [IsAuthenticated]

    def _get_basket(self, user):
        """Возвращает активную корзину пользователя (создаёт при отсутствии)."""
        basket, _ = Order.objects.get_or_create(user=user, state=Order.OrderState.BASKET)
        return basket

    @extend_schema(
        responses={200: OrderSerializer},
        summary='Получить корзину',
        tags=['Корзина'],
    )
    def get(self, request):
        basket = self._get_basket(request.user)
        serializer = OrderSerializer(basket)
        return Response(serializer.data)

    @extend_schema(
        request=inline_serializer('BasketAddRequest', fields={
            'items': drf_serializers.ListField(child=inline_serializer('BasketItem', fields={
                'product_info': drf_serializers.IntegerField(),
                'quantity': drf_serializers.IntegerField(),
            })),
        }),
        responses={200: OpenApiResponse(description='Товары добавлены')},
        summary='Добавить товары в корзину',
        tags=['Корзина'],
    )
    def post(self, request):
        """Добавить товары: {"items": [{"product_info": id, "quantity": n}]}"""
        basket = self._get_basket(request.user)
        items = request.data.get('items', [])
        if not items:
            return Response({'error': 'Список товаров пуст'}, status=status.HTTP_400_BAD_REQUEST)

        errors = []
        for item in items:
            product_info_id = item.get('product_info')
            quantity = item.get('quantity', 1)
            try:
                product_info = ProductInfo.objects.get(id=product_info_id, shop__state=True)
                OrderItem.objects.create(
                    order=basket,
                    product_info=product_info,
                    quantity=quantity,
                )
            except ProductInfo.DoesNotExist:
                errors.append(f'Товар {product_info_id} не найден')
            except IntegrityError:
                errors.append(f'Товар {product_info_id} уже в корзине')

        if errors:
            return Response({'status': 'partial', 'errors': errors})
        return Response({'status': 'ok'})

    @extend_schema(
        request=inline_serializer('BasketUpdateRequest', fields={
            'items': drf_serializers.ListField(child=inline_serializer('BasketUpdateItem', fields={
                'id': drf_serializers.IntegerField(),
                'quantity': drf_serializers.IntegerField(),
            })),
        }),
        responses={200: OpenApiResponse(description='Количество обновлено')},
        summary='Обновить количество в корзине',
        tags=['Корзина'],
    )
    def put(self, request):
        """Обновить количество: {"items": [{"id": item_id, "quantity": n}]}"""
        basket = self._get_basket(request.user)
        items = request.data.get('items', [])
        if not items:
            return Response({'error': 'Список позиций пуст'}, status=status.HTTP_400_BAD_REQUEST)

        for item in items:
            OrderItem.objects.filter(
                id=item.get('id'),
                order=basket,
            ).update(quantity=item.get('quantity'))

        return Response({'status': 'ok'})

    @extend_schema(
        request=inline_serializer('BasketDeleteRequest', fields={
            'items': drf_serializers.ListField(child=drf_serializers.IntegerField()),
        }),
        responses={200: OpenApiResponse(description='Позиции удалены')},
        summary='Удалить позиции из корзины',
        tags=['Корзина'],
    )
    def delete(self, request):
        """Удалить позиции: {"items": [item_id, ...]}"""
        basket = self._get_basket(request.user)
        item_ids = request.data.get('items', [])
        if not item_ids:
            return Response({'error': 'Укажите список id позиций'}, status=status.HTTP_400_BAD_REQUEST)

        OrderItem.objects.filter(id__in=item_ids, order=basket).delete()
        return Response({'status': 'ok'})


class OrderView(APIView):
    """
    Заказы покупателя.
    GET — список всех заказов (кроме корзины),
    POST — подтвердить корзину (перевести в статус «new»).
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: OrderSerializer(many=True)},
        summary='Список заказов',
        tags=['Заказы'],
    )
    def get(self, request):
        orders = (
            Order.objects.filter(user=request.user)
            .exclude(state=Order.OrderState.BASKET)
            .prefetch_related(
                'order_items__product_info__product',
                'order_items__product_info__shop',
                'contact',
            )
        )
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

    @extend_schema(
        request=inline_serializer('ConfirmOrderRequest', fields={
            'contact': drf_serializers.IntegerField(required=False, help_text='ID контакта доставки'),
        }),
        responses={
            201: OrderSerializer,
            400: OpenApiResponse(description='Корзина пуста или контакт не найден'),
        },
        summary='Подтвердить заказ',
        tags=['Заказы'],
    )
    def post(self, request):
        """Подтвердить корзину. {"contact": contact_id}"""
        try:
            basket = Order.objects.get(user=request.user, state=Order.OrderState.BASKET)
        except Order.DoesNotExist:
            return Response({'error': 'Корзина пуста'}, status=status.HTTP_400_BAD_REQUEST)

        if not basket.order_items.exists():
            return Response({'error': 'В корзине нет товаров'}, status=status.HTTP_400_BAD_REQUEST)

        contact_id = request.data.get('contact')
        if contact_id:
            try:
                contact = Contact.objects.get(id=contact_id, user=request.user)
                basket.contact = contact
            except Contact.DoesNotExist:
                return Response({'error': 'Контакт не найден'}, status=status.HTTP_400_BAD_REQUEST)

        basket.state = Order.OrderState.NEW
        basket.save(update_fields=['state', 'contact'])

        # Отправляем email асинхронно через Celery
        from tasks.email_tasks import send_order_confirmation_task
        send_order_confirmation_task.delay(basket.id)

        serializer = OrderSerializer(basket)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminOrderView(APIView):
    """Управление заказами для администратора."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: OrderSerializer(many=True), 403: OpenApiResponse(description='Доступ запрещён')},
        summary='Все заказы (admin)',
        tags=['Администратор'],
    )
    def get(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Доступ запрещён'}, status=status.HTTP_403_FORBIDDEN)

        orders = (
            Order.objects.exclude(state=Order.OrderState.BASKET)
            .prefetch_related('order_items__product_info__product', 'contact')
            .select_related('user')
        )
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

    @extend_schema(
        request=inline_serializer('AdminOrderUpdateRequest', fields={
            'id': drf_serializers.IntegerField(),
            'state': drf_serializers.ChoiceField(choices=[
                'new', 'confirmed', 'assembled', 'sent', 'delivered', 'cancelled',
            ]),
        }),
        responses={
            200: OrderSerializer,
            400: OpenApiResponse(description='Недопустимый статус'),
            403: OpenApiResponse(description='Доступ запрещён'),
            404: OpenApiResponse(description='Заказ не найден'),
        },
        summary='Изменить статус заказа (admin)',
        tags=['Администратор'],
    )
    def put(self, request):
        """Изменить статус заказа. {"id": order_id, "state": "confirmed"}"""
        if not request.user.is_staff:
            return Response({'error': 'Доступ запрещён'}, status=status.HTTP_403_FORBIDDEN)

        order_id = request.data.get('id')
        new_state = request.data.get('state')

        valid_states = [s.value for s in Order.OrderState if s != Order.OrderState.BASKET]
        if new_state not in valid_states:
            return Response(
                {'error': f'Недопустимый статус. Доступны: {valid_states}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({'error': 'Заказ не найден'}, status=status.HTTP_404_NOT_FOUND)

        order.state = new_state
        order.save(update_fields=['state'])

        # Уведомляем покупателя асинхронно через Celery
        from tasks.email_tasks import send_status_notification_task
        send_status_notification_task.delay(order.id)

        serializer = OrderSerializer(order)
        return Response(serializer.data)


def _send_order_confirmation(order: Order):
    """Отправляет email покупателю и администратору при подтверждении заказа."""
    items_text = '\n'.join(
        f'  • {item.product_info.product.name} ({item.product_info.shop.name}) x {item.quantity} = '
        f'{item.product_info.price * item.quantity} ₽'
        for item in order.order_items.select_related('product_info__product', 'product_info__shop').all()
    )

    subject = f'Заказ #{order.id} принят'
    message = (
        f'Ваш заказ #{order.id} успешно оформлен.\n\n'
        f'Состав заказа:\n{items_text}\n\n'
        f'Итого: {order.total_sum} ₽'
    )

    # Email покупателю
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[order.user.email],
        fail_silently=True,
    )

    # Email администратору
    admin_message = (
        f'Новый заказ #{order.id} от {order.user.email}.\n\n'
        f'Состав:\n{items_text}\n\n'
        f'Итого: {order.total_sum} ₽'
    )
    send_mail(
        subject=f'Новый заказ #{order.id}',
        message=admin_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[settings.ADMIN_EMAIL],
        fail_silently=True,
    )


def _send_status_notification(order: Order):
    """Уведомляет покупателя об изменении статуса заказа."""
    send_mail(
        subject=f'Статус заказа #{order.id} изменён',
        message=(
            f'Статус вашего заказа #{order.id} изменён на «{order.get_state_display()}».'
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[order.user.email],
        fail_silently=True,
    )
