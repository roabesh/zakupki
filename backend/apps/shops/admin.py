from django.contrib import admin
from .models import Shop, ShopOrder


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'state', 'url')
    list_filter = ('state',)
    search_fields = ('name',)
    list_editable = ('state',)


@admin.register(ShopOrder)
class ShopOrderAdmin(admin.ModelAdmin):
    list_display = ('order', 'shop', 'state')
    list_filter = ('state', 'shop')
    search_fields = ('order__id', 'shop__name')
