from backend.config.settings import ENV


def send_alert(titulo: str, mensagem: str) -> None:
    """
    Envia alerta quando um agente falha.
    Em desenvolvimento apenas imprime no terminal.
    """

    if ENV == "development":
        print("\n==============================")
        print("ALERTA")
        print("==============================")
        print(titulo)
        print(mensagem)
        print("==============================\n")
        return

    # TODO Sprint 3
    # Implementar envio real via e-mail, WhatsApp ou n8n