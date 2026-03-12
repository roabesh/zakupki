import yaml
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from apps.products.services import load_price_from_url, load_price_from_file, import_price
from apps.products.models import ProductInfo
from apps.products.serializers import ProductInfoSerializer
from .models import Shop
from .serializers import ShopSerializer, PartnerStateSerializer


class ShopListView(APIView):
    """Список активных магазинов."""

    permission_classes = []  # доступно без авторизации

    def get(self, request):
        shops = Shop.objects.filter(state=True)
        serializer = ShopSerializer(shops, many=True)
        return Response(serializer.data)


class PartnerUpdateView(APIView):
    """Загрузка/обновление прайса поставщика."""

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
                data = load_price_from_url(url)
            else:
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
    """Список заказов, содержащих товары данного поставщика."""

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

        orders = (
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
        return Response(serializer.data)


class PartnerExportView(APIView):
    """Экспорт текущего прайса поставщика в формате YAML."""

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

        from django.http import HttpResponse
        response = HttpResponse(yaml_content, content_type='application/x-yaml')
        response['Content-Disposition'] = f'attachment; filename="{shop.name}_price.yaml"'
        return response
