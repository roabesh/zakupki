from django.urls import path
from .views import ShopListView, PartnerUpdateView, PartnerStateView, PartnerOrdersView, PartnerExportView

urlpatterns = [
    path('shops/', ShopListView.as_view(), name='shops'),
    path('partner/update/', PartnerUpdateView.as_view(), name='partner-update'),
    path('partner/state/', PartnerStateView.as_view(), name='partner-state'),
    path('partner/orders/', PartnerOrdersView.as_view(), name='partner-orders'),
    path('partner/export/', PartnerExportView.as_view(), name='partner-export'),
]
