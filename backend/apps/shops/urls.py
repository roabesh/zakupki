from django.urls import path
from .views import ShopListView, PartnerUpdateView, PartnerStateView, PartnerOrdersView, PartnerOrderDetailView, PartnerExportView

urlpatterns = [
    path('shops/', ShopListView.as_view(), name='shops'),
    path('partner/update/', PartnerUpdateView.as_view(), name='partner-update'),
    path('partner/state/', PartnerStateView.as_view(), name='partner-state'),
    path('partner/orders/', PartnerOrdersView.as_view(), name='partner-orders'),
    path('partner/orders/<int:pk>/', PartnerOrderDetailView.as_view(), name='partner-order-detail'),
    path('partner/export/', PartnerExportView.as_view(), name='partner-export'),
]
