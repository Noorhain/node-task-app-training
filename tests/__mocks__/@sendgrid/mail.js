// El mock debe replicar las funcionalidades de la librería que suplanta
// Su utilidad se entiende fácilmente con servicios como SendGrid: sin un mock, nos veríamos obligados a enviar un correo nuevo por cada test que involucrase la creación o el borrado de usuarios. Con el Mock nos ahorramos esto

module.exports = {
    setApiKey() {
        // Puede quedar vacío. Con esto, el test se limita a llamar la función de este mock cuando toque procesar el email, pero no ejecutará ningún contenido y el test sencillamente se moverá hacia el siguiente paso
    },
    send() {
    }
};