
from django.urls import path

from .views import (
    LoginView,
    LogoutView,
    ProfileView,
    RegisterView,
    SocialLoginView,
    SocialNonceView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('social/nonce/', SocialNonceView.as_view(), name='social-nonce'),
    path('social/login/', SocialLoginView.as_view(), name='social-login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', ProfileView.as_view(), name='profile'),
]
