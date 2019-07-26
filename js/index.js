'use strict';
var smart;
var database = [];
var filtered_database = [];

$(document).ready(init);

function init() {
    smart = FHIR.client({
        serviceUrl: 'https://r2.smarthealthit.org'
    });

    smart.api.search({ type: 'Patient' })
        .then(function (bundle) {
            loadPatients(bundle);
            displayPatients(filtered_database);
        });

    $("#textbox").on("keyup", live_search);
    $("#male").click(function () {
        live_search();
    });
    $("#female").click(function () {
        live_search();
    });
}

function live_search() {
    function get_gender() {
        if ($("#male").is(":checked"))
            return "male";
        else if ($("#female").is(":checked"))
            return "female";
        else
            return "";
    }
    var text = $("#textbox").val();
    var date = $("#datebox").val();
    var gender = get_gender();

    filtered_database = [];
    for (var i = 0; i < database.length; i++) {
        var name = database[i].name;
        var gen = database[i].gender;
        var birth = database[i].birth_date;
        var name_search = name.toUpperCase().search(text.toUpperCase().trim()) != -1;
        var birth_search = (birth === date);
        var gender_search = (gender === gen || gender === "");
        if (birth_search || gender_search && name_search)
            filtered_database.push(database[i]);
    }
    displayPatients(filtered_database);
}

function loadPatients(results) {
    var raw_data = results.data.entry;
    for (var i = 0; i < raw_data.length; ++i) {
        var entry = raw_data[i].resource;
        var id = entry.id;
        var name = entry.name;
        var birth_date = entry.birthDate;
        var gender = entry.gender;
        var race = "";
        var address = "";
        var age = new Date().getFullYear() - parseInt(birth_date.split("-")[0])
        if (entry.address) {
            var address_object = entry.address[0];
            address = clean(address_object, "city") + ", " + clean(address_object, "state") + ", " + clean(address_object, "country") + " " + clean(address_object, "postalCode");
        }
        var patient = {
            id: id,
            name: name[0].given + " " + name[0].family,
            birth_date: birth_date,
            gender: gender,
            race: race,
            address: address,
            age: age
        };
        database.push(patient);
    }
    filtered_database = database;
    filtered_database.sort(sort_comp("name", false));
}

function clean(object, attr) {
    if (object[attr])
        return object[attr];
    return "";
}

function displayPatients(data) {
    $(".data_row").remove(); //remove the previous table data
    var template = $("#patient-template").html(); //get the template
    var html_maker = new htmlMaker(template); //create an html Maker
    var html = html_maker.getHTML(data); //generate dynamic HTML based on the data
    $("#patients").append(html);
    $(".data_row").click(function () {
        $(".data_row").removeClass("selected_row");
        var id = $(this).attr("data-patient-id");
        $(this).addClass("selected_row");
        $("#table").css("display", "block");
        displayPatientDetails(id);
        loadMedications(id);
    });
}

function displayPatientDetails(id) {
    var template = $("#detail_template").html();
    var html_maker = new htmlMaker(template);
    var data;
    for (var i of filtered_database) {
        if (i.id === id) {
            data = i;
            break;
        }
    }
    var html = html_maker.getHTML(data);
    $("#top_table").html(html);
}

function loadMedications(id) {
    var medication = [];
    smart.api.search({ type: 'MedicationOrder', query: { patient: id } }).then(
        function (bundle) {
            var entry = bundle.data.entry;
            if (entry) {
                for (let i = 0; i < entry.length; ++i) {
                    var resource = entry[i].resource
                    var date = resource.dateWritten;
                    var medication_name = resource.medicationCodeableConcept.text;
                    medication.push({ name: medication_name, date: date });
                }
            }
            $("#detail").html("");
            for (var i of medication) {
                var template = $("#medication_template").html();
                var html_maker = new htmlMaker(template);
                var html = html_maker.getHTML(i);
                $("#detail").append(html);
            }
        }
    );
}

function sort_comp(field, desc) {
    return function (a, b) {
        if (a[field] == b[field])
            return 0;
        if (a[field] < b[field]) {
            if (desc)
                return 1;
            return -1;
        }
        if (desc)
            return -1;
        return 1;
    };
}

