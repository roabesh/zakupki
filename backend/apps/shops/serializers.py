from rest_framework import serializers
from .models import Shop


class ShopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shop
        fields = ('id', 'name', 'state')


class PartnerStateSerializer(serializers.ModelSerializer):
    """Сериализатор для получения и изменения статуса приёма заказов."""

    class Meta:
        model = Shop
        fields = ('state',)
