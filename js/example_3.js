var smart;
var database=[];
var filtered_database=[];

$(document).ready(init);

function init(){
var smart = FHIR.client({
  serviceUrl: 'https://r2.smarthealthit.org'
});

smart.api.search({type: 'Patient'})
        .then(function(bundle){
                loadPatients(bundle);
                displayPatients(filtered_database);
    }); 
    
    $("#textbox").on("keyup",live_search);
}

function live_search(){
    var text=$("#textbox").val();
    
    filtered_database=[];
    for(var i=0;i<database.length;i++){
        var name=database[i].name;
        var name_search=name.toUpperCase().search(text.toUpperCase().trim())!=-1;
        if(name_search)
            filtered_database.push(database[i]);
    }
    displayPatients(filtered_database);    
}

function loadPatients(results){
    var raw_data=results.data.entry;
    for(var i=0;i<raw_data.length;++i){
        var entry=raw_data[i].resource;
        var id=entry.id;
        var name=entry.name;
        var birth_date=entry.birthDate;
        var gender=entry.gender;
        var race="";
        var address="";
        if(entry.address){
            var address_object=entry.address[0];
            address=clean(address_object,"city")+", "+clean(address_object,"state")+", "+clean(address_object,"country")+" "+clean(address_object,"postalCode");
        }
        var patient={id:id,name:name[0].given+" "+name[0].family,birth_date:birth_date,gender:gender,race:race,address:address};
        database.push(patient);
    }
    filtered_database=database;
    filtered_database.sort(sort_comp("name",false));   
}

function clean(object,attr){
    if(object[attr])
        return object[attr];
    return "";
}

function displayPatients (data) {
    $(".data_row").remove(); //remove the previous table data
    var template=$("#patient-template").html(); //get the template
    var html_maker = new htmlMaker(template); //create an html Maker
    var html = html_maker.getHTML(data); //generate dynamic HTML based on the data
    $("#patients").append(html);  
    $(".data_row").click(function(){
        $(".data_row").removeClass("selected_row");
       var id=$(this).attr("data-patient-id");
       $(this).addClass("selected_row");
       displayPatientDetails(id);
       loadMedications(id);
    });
}
    


function sort_comp(field,desc){
            return function (a,b){
                if(a[field]==b[field])
                    return 0;
                if(a[field]<b[field]){
                    if(desc)
                        return 1;
                        return -1;
                    }
                    if(desc)
                        return -1;
                    return 1;
            };    
}

