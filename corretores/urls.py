from django.urls import path
from . import views
from django.urls import path
from . import views

urlpatterns = [
    # Páginas Web (HTML)
    path('', views.home, name='home'),
    path('registro/', views.registro, name='registro'),
    path('login/', views.login, name='login'),
    path('login/perfil.html/', views.perfil_redirect),
    path('perfil/', views.perfil, name='perfil'),
    path('suporte/', views.suporte, name='suporte'),
    path('terms/', views.terms, name='terms'),
    path('privacy/', views.privacy, name='privacy'),
    path('anunciar/', views.anunciar, name='anunciar'),
    path('esqueceu-senha/', views.esqueceu_senha, name='esqueceu_senha'),
    path('register/', views.registro, name='register'),
    path('confirmacao-pendente/', views.confirmacao_pendente, name='confirmacao_pendente'),

    # Fluxo de ativação
    path('confirmar/<str:uidb64>/<str:token>/', views.AtivarContaView.as_view(), name='confirmar_email'),
    path('checar-ativacao/', views.ChecarAtivacaoView.as_view(), name='checar_ativacao'),
    path('ativacao-sucesso/', views.home, name='ativacao_sucesso'),

    # Perfil e anúncios
    path('api/meu-perfil/', views.PerfilCorretorView.as_view(), name='meu_perfil'),
    path('api/perfil/<int:pk>/', views.PerfilPublicView.as_view(), name='api_perfil_public'),
    path('perfil/<int:pk>/', views.perfil, name='perfil_view'),
    path('anuncio/<int:pk>/', views.anuncio_view, name='anuncio_view'),
    path('publicar-anuncio/', views.PublicarAnuncioView.as_view(), name='publicar_anuncio'),
    path('api/publicar-anuncio/', views.PublicarAnuncioView.as_view()),
    path('editar-anuncio/<int:pk>/', views.editar_anuncio, name='editar_anuncio'),


    # Reset de senha
    path('password-reset/', views.SolicitarResetSenhaView.as_view(), name='password_reset'),
    path('password-reset-confirm/', views.ConfirmarResetSenhaView.as_view(), name='password_reset_confirm'),

    # API
    path('api/sugestoes-cidade/', views.sugestoes_cidade, name='sugestoes_cidade'),
    path('api/registrar/', views.RegistroView.as_view(), name='api_registrar'),
    path('api/login/', views.LoginView.as_view(), name='api_login'),
    path('api/anuncios/', views.AnuncioListView.as_view(), name='api_anuncios'),
    path('api/anuncios/<int:pk>/', views.AnuncioDetailView.as_view(), name='api_anuncio_detail'),
    path('api/anuncios/<int:pk>/editar/', views.EditarAnuncioView.as_view(), name='api_editar_anuncio'),
    path('planos/', views.planos, name='planos'),
    path('confirmar-plano/<str:plan_id>/', views.confirmar_plano, name='confirmar_plano'),
]