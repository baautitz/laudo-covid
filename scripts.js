const siteTitle = $("#title")[0].innerHTML;

function loadInputMasks() {
  const telefoneOptions = {
    onKeyPress: (telefone, e, field, options) => {
      if ($("#tipo-paciente").val() == "estrangeiro") {
        $("#telefone").mask("+0#", telefoneOptions);
        return;
      }

      const masks = ["(00) 0000-00000", "(00) 00000-00000", "+0#"];
      const regex = /[0-9]*/g;
      const telefoneLimpo = telefone.match(regex).join("");
      const loadMask = () => {
        if (telefoneLimpo.length < 11) return masks[0];
        else if (telefoneLimpo.length < 12) return masks[1];
        else return masks[2];
      };
      $("#telefone").mask(loadMask(), telefoneOptions);
    },
  };

  $(".data").mask("00/00/0000");
  $("#cpf").mask("000.000.000-00");
  $("#telefone").mask("#", telefoneOptions);
  $("#cep").mask("00000-000");
  $("#horario-realizado").mask("00:00");
}

function loadInputs() {
  if ($("#tipo-paciente").val() == "brasileiro") {
    for (element of $(".paciente-brasileiro")) {
      if (!element.classList.contains("disabled")) continue;

      element.classList.remove("disabled");
    }

    for (element of $(".paciente-estrangeiro")) {
      if (element.classList.contains("paciente-brasileiro")) continue;
      if (element.classList.contains("disabled")) continue;

      element.classList.add("disabled");
    }
  } else if ($("#tipo-paciente").val() == "estrangeiro") {
    for (element of $(".paciente-estrangeiro")) {
      if (!element.classList.contains("disabled")) continue;

      element.classList.remove("disabled");
    }

    for (element of $(".paciente-brasileiro")) {
      if (element.classList.contains("paciente-estrangeiro")) continue;
      if (element.classList.contains("disabled")) continue;

      element.classList.add("disabled");
    }
  }

  if ($("#inicio-sintoma").val().length == 10) {
    $("#sintomas-div")[0].classList.remove("disabled");
  }
}

function loadParams() {
  const url = new URL(window.location.href);

  for (let select of $("select")) {
    let id = select.id;

    if (url.searchParams.get(id)) $(`#${id}`).val(url.searchParams.get(id));
  }

  for (let input of $(".form-input > input")) {
    let id = input.id;

    if (url.searchParams.get(id))
      $(`#${id}`).val(url.searchParams.get(id).toUpperCase());
  }

  if (url.searchParams.get("resultado-exame"))
    $(`#${url.searchParams.get("resultado-exame").toLocaleLowerCase()}`).prop(
      "checked",
      true
    );

  let date = new Date(Date.now());
  if (!url.searchParams.get("horario-realizado")) {
    $("#horario-realizado").val(
      `${String(date.getHours()).padStart(2, "0")}:${String(
        date.getMinutes()
      ).padStart(2, "0")}`
    );
  }

  if (!url.searchParams.get("data-realizada")) {
    $("#data-realizada").val(
      `${String(date.getDate()).padStart(2, "0")}/${String(
        date.getMonth() + 1
      ).padStart(2, "0")}/${String(date.getFullYear()).padStart(2, "0")}`
    );
  }

  if ($("#nome").val() == 0) $("#title")[0].innerHTML = siteTitle;
  else $("#title")[0].innerHTML = $("#nome").val().toUpperCase();
}

function loadInputsEvents() {
  $("#tipo-paciente").change(loadInputs);

  $("#nome").on("input", () => {
    const nomeValue = $("#nome").val();
    if (nomeValue.length == 0) $("#title")[0].innerHTML = siteTitle;
    else $("#title")[0].innerHTML = nomeValue.toUpperCase();
  });

  $("#cep").on("input", async (e) => {
    if (e.currentTarget.value.length == 9) {
      $(".loading-wrapper").removeClass("disabled");

      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${e.currentTarget.value}/json`
        );

        if (response.status != 200) {
          alert("CEP não encontrado!");
          return;
        }
        if (
          !confirm("CEP encontrado, deseja preencher endereço automaticamente?")
        )
          return;

        const { localidade, bairro, logradouro, uf } = await response.json();
        $("#logradouro").val(logradouro.toUpperCase());
        $("#cidade").val(`${localidade} - ${uf}`.toUpperCase());
        $("#bairro").val(bairro.toUpperCase());
        $("#numero-logradouro").focus();
      } catch (e) {
        alert("Não foi possível consultar o CEP!");
        return;
      } finally {
        $(".loading-wrapper").addClass("disabled");
      }
    }
  });
  $("#inicio-sintoma").on("input", (e) => {
    if (e.currentTarget.value.length == 10) {
      $("#sintomas-div")[0].classList.remove("disabled");
    } else {
      $("#sintomas-div")[0].classList.add("disabled");
    }
  });
}

function saveButtonEvent(e) {
  const link = document.createElement("a");

  const userUrl = new URL(window.location.href);
  const savedURL = new URL(userUrl.origin + userUrl.pathname);

  for (let select of $("select")) {
    savedURL.searchParams.append(select.name, select.value);
  }

  for (let input of $("input")) {
    if (input.type == "radio" && !input.checked) continue;
    if (!input.value) continue;

    savedURL.searchParams.append(input.name, input.value);
  }

  const content =
    "<" + "script>" + `window.location.href = "${savedURL}"` + "<" + "/script>";
  const file = new Blob([content], { type: "text/html" });

  window.print();

  link.href = URL.createObjectURL(file);
  link.download = $("#nome")[0].value
    ? `${$("#nome")[0]
      .value.toUpperCase()
      .replaceAll(" ", "_")}-${Date.now()}.html`
    : `LAUDO-${Date.now()}.html`;
  link.click();

  URL.revokeObjectURL(link.href);
}

loadParams();
loadInputMasks();
loadInputs();
loadInputsEvents();
$("#save-button").on("click", (e) => saveButtonEvent(e));

window.onbeforeunload = function () {
  return "Are you sure";
};
