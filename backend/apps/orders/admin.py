from django.contrib import admin
from .models import Contact, Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product_info', 'quantity')


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('user', 'type', 'phone', 'city', 'street', 'house')
    list_filter = ('type',)
    search_fields = ('user__email', 'phone', 'city')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'state', 'created_at', 'total_sum')
    list_filter = ('state', 'created_at')
    search_fields = ('user__email',)
    readonly_fields = ('created_at', 'total_sum')
    inlines = [OrderItemInline]

    @admin.display(description='Сумма')
    def total_sum(self, obj):
        return f'{obj.total_sum} ₽'
