function getScriptText(vScriptName,servProvCode,useProductScripts){
	servProvCode||(servProvCode=aa.getServiceProviderCode()),vScriptName=vScriptName.toUpperCase();
	var emseBiz=aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	try{
		if(useProductScripts)
			var emseScript=emseBiz.getMasterScript(aa.getServiceProviderCode(),vScriptName);
		else 
			var emseScript=emseBiz.getScriptByPK(aa.getServiceProviderCode(),vScriptName,"ADMIN");
		return emseScript.getScriptText()+""
	}
	catch(err){
		return""
		}
}
var useCustomScriptFile=!0,showMessage=!1,showDebug=!1,disableTokens=!1,useAppSpecificGroupName=!1,useTaskSpecificGroupName=!1,enableVariableBranching=!1,maxEntries=99,cancel=!1,startDate=new Date,startTime=startDate.getTime(),message="",debug="",br="<BR />",useSA=!1,SA=null,SAScript=null,capId,bzr=aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_FOR_EMSE");
bzr.getSuccess()&&"I"!=bzr.getOutput().getAuditStatus()&&(useSA=!0,SA=bzr.getOutput().getDescription(),bzr=aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_INCLUDE_SCRIPT"),bzr.getSuccess()&&(SAScript=bzr.getOutput().getDescription())),SA?(eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",SA,useCustomScriptFile)),eval(getScriptText(SAScript,SA))):eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",null,useCustomScriptFile)),eval(getScriptText("INCLUDES_CUSTOM",null,useCustomScriptFile));
var publicUser=!1,currentUserID=aa.env.getValue("CurrentUserID"),publicUserID=aa.env.getValue("CurrentUserID");
0==currentUserID.indexOf("PUBLICUSER")&&(currentUserID="ADMIN",publicUser=!0);
var systemUserObj=aa.person.getUser(currentUserID).getOutput();
bs.batch.RenewalRecord_RL_06();