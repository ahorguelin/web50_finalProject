from django.urls import path
from . import views
urlpatterns = [
    path('category/', views.category, name='category'),
    path('transaction/', views.transaction, name='transaction'),
    path('delete', views.delete, name='delete')
]