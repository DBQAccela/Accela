// User Configurable Parameters
var SCRIPT_VERSION = 2.0;
eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
eval(getScriptText("INCLUDES_CUSTOM"));
	
function getScriptText(vScriptName){
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(),vScriptName);
	return emseScript.getScriptText() + "";	
}


//Parameters Initialization
showMessage = true;		
showDebug = true;
var s_id1 = aa.env.getValue("PermitId1");
var s_id2 = aa.env.getValue("PermitId2");
var s_id3 = aa.env.getValue("PermitId3");
var targetCapID =  aa.cap.getCapID(s_id1, s_id2, s_id3).getOutput();
var serviceProviderCode = aa.getServiceProviderCode();
var currentUserID = aa.getAuditID();


//Get the addressModels by cap.
var capAddressResult = aa.address.getAddressByCapId(targetCapID);
if (capAddressResult.getSuccess())
{
	var addressModelArray = capAddressResult.getOutput();
	for (yy in addressModelArray)
	{
		//Change the addressModel attributes.
		var editAddressModel = addressModelArray[yy];
        editAddressModel.setHouseNumberStart(13); 

        //Update the addressModel
		 updateAddresses(targetCapID, editAddressModel);
	}
}


