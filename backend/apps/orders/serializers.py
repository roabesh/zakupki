from rest_framework import serializers
from .models import Contact, Order, OrderItem
from apps.products.serializers import ProductInfoSerializer


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ('id', 'type', 'phone', 'city', 'street', 'house', 'structure', 'building', 'apartment')
        read_only_fields = ('id',)

    def validate(self, attrs):
        user = self.context['request'].user
        contact_type = attrs.get('type', getattr(self.instance, 'type', None))

        if contact_type == Contact.ContactType.PHONE:
            # Проверяем: у пользователя уже есть телефон (кроме текущего при обновлении)
            qs = Contact.objects.filter(user=user, type=Contact.ContactType.PHONE)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError('Можно сохранить только один номер телефона')

        elif contact_type == Contact.ContactType.ADDRESS:
            # Проверяем: не более 5 адресов
            qs = Contact.objects.filter(user=user, type=Contact.ContactType.ADDRESS)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.count() >= 5:
                raise serializers.ValidationError('Можно сохранить не более 5 адресов')

        return attrs


class OrderItemSerializer(serializers.ModelSerializer):
    product_info = ProductInfoSerializer(read_only=True)
    product_info_id = serializers.PrimaryKeyRelatedField(
        source='product_info',
        queryset=__import__('apps.products.models', fromlist=['ProductInfo']).ProductInfo.objects.all(),
        write_only=True,
    )

    class Meta:
        model = OrderItem
        fields = ('id', 'product_info', 'product_info_id', 'quantity')


class OrderSerializer(serializers.ModelSerializer):
    order_items = OrderItemSerializer(many=True, read_only=True)
    total_sum = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    contact = ContactSerializer(read_only=True)
    contact_id = serializers.PrimaryKeyRelatedField(
        source='contact',
        queryset=Contact.objects.all(),
        write_only=True,
        required=False,
    )
    # Статусы по каждому поставщику: {shop_name: state}
    shop_states = serializers.SerializerMethodField()

    def get_shop_states(self, obj):
        from apps.shops.models import ShopOrder
        return {
            so.shop.name: so.state
            for so in ShopOrder.objects.filter(order=obj).select_related('shop')
        }

    class Meta:
        model = Order
        fields = ('id', 'state', 'created_at', 'contact', 'contact_id',
                  'order_items', 'total_sum', 'shop_states')
        read_only_fields = ('id', 'created_at')
