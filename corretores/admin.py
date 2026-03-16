from django.contrib import admin
from .models import Corretor, Anuncio

admin.site.register(Corretor)

@admin.register(Anuncio)
class AnuncioAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'corretor', 'cidade', 'preco', 'data_criacao')
    list_filter = ('cidade', 'finalidade')
    search_fields = ('titulo', 'descricao')
