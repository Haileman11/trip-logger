from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TripViewSet, StopViewSet, LogSheetViewSet

router = DefaultRouter()
router.register(r'trips', TripViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('trips/<int:trip_pk>/stops/', StopViewSet.as_view({'get': 'list', 'post': 'create'}), name='trip-stops'),
    path('trips/<int:trip_pk>/stops/<int:pk>/', StopViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='trip-stop-detail'),
    path('trips/<int:trip_pk>/log-sheets/', LogSheetViewSet.as_view({'get': 'list', 'post': 'create'}), name='trip-log-sheets'),
    path('trips/<int:trip_pk>/log-sheets/<int:pk>/', LogSheetViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='trip-log-sheet-detail'),
] 