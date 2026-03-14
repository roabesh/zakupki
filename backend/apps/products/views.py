from django.db.models import Count, Q
from rest_framework.generics import ListAPIView, RetrieveAPIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from drf_spectacular.utils import extend_schema

from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer


class CategoryListView(ListAPIView):
    """Список всех категорий с количеством активных товаров."""

    serializer_class = CategorySerializer
    permission_classes = []  # доступно без авторизации

    def get_queryset(self):
        # Аннотируем каждую категорию числом уникальных товаров
        # с остатком > 0 в магазинах, принимающих заказы
        return Category.objects.annotate(
            product_count=Count(
                'products',
                filter=Q(
                    products__product_infos__shop__state=True,
                    products__product_infos__quantity__gt=0,
                ),
                distinct=True,
            )
        ).order_by('name')


class ProductListView(ListAPIView):
    """
    Каталог товаров.
    Фильтрация: ?shop_id=1 ?category_id=2
    Поиск: ?search=iphone
    """

    serializer_class = ProductSerializer
    permission_classes = []  # доступно без авторизации
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = {
        'product_infos__shop': ['exact'],
        'category': ['exact'],
    }
    search_fields = ['name', 'product_infos__model']

    def get_queryset(self):
        # Показываем только товары из магазинов, принимающих заказы
        return (
            Product.objects.filter(
                product_infos__shop__state=True,
                product_infos__quantity__gt=0,
            )
            .select_related('category')
            .prefetch_related(
                'product_infos__shop',
                'product_infos__product_parameters__parameter',
            )
            .distinct()
        )


@extend_schema(
    responses={200: ProductSerializer},
    summary='Детали товара',
    tags=['Каталог'],
)
class ProductDetailView(RetrieveAPIView):
    """Получение полной информации о конкретном товаре с характеристиками."""

    serializer_class = ProductSerializer
    permission_classes = []  # доступно без авторизации

    def get_queryset(self):
        return (
            Product.objects.select_related('category')
            .prefetch_related(
                'product_infos__shop',
                'product_infos__product_parameters__parameter',
            )
        )
