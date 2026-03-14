from rest_framework import serializers
from .models import Category, Product, ProductInfo, ProductParameter


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = ('id', 'name', 'product_count')


class ProductParameterSerializer(serializers.ModelSerializer):
    parameter = serializers.StringRelatedField()

    class Meta:
        model = ProductParameter
        fields = ('parameter', 'value')


class ProductInfoSerializer(serializers.ModelSerializer):
    """Информация о товаре в конкретном магазине."""

    shop = serializers.StringRelatedField()
    product_parameters = ProductParameterSerializer(many=True, read_only=True)

    class Meta:
        model = ProductInfo
        fields = ('id', 'shop', 'model', 'external_id', 'quantity', 'price', 'price_rrc', 'product_parameters')


class ProductSerializer(serializers.ModelSerializer):
    """Товар с информацией по всем магазинам."""

    category = CategorySerializer(read_only=True)
    product_infos = ProductInfoSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ('id', 'name', 'category', 'product_infos')
