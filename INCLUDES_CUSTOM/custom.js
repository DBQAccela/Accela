function runReportTest(aaReportName){
	x="test param 1",currentUserID="ADMIN",setCode="X";
	var reportName=aaReportName;
	report=aa.reportManager.getReportModelByName(reportName),report=report.getOutput();
	var permit=aa.reportManager.hasPermission(reportName,currentUserID);
	if(permit.getOutput().booleanValue()){
		var parameters=aa.util.newHashMap();
		parameters.put("BatchNumber",setCode);
		var msg=aa.reportManager.runReport(parameters,report);
		aa.env.setValue("ScriptReturnCode","0"),aa.env.setValue("ScriptReturnMessage",msg.getOutput())
	}
}
function createRefLicProf(rlpId,rlpType,pContactType){
	var updating=!1,capContResult=aa.people.getCapContactByCapID(capId);
	if(!capContResult.getSuccess())
		return logDebug("**ERROR: getting cap contact: "+capAddResult.getErrorMessage()),!1;
	if(conArr=capContResult.getOutput(),!conArr.length)
		return logDebug("**WARNING: No contact available"),!1;
	var newLic=getRefLicenseProf(rlpId);
	if(newLic)updating=!0,logDebug("Updating existing Ref Lic Prof : "+rlpId);
		else var newLic=aa.licenseScript.createLicenseScriptModel();
	if(null==pContactType)var cont=conArr[0];
		else{
			var contFound=!1;
			for(yy in conArr)
				if(pContactType.equals(conArr[yy].getCapContactModel().getPeople().getContactType())){
					cont=conArr[yy],contFound=!0;
					break
				}
				if(!contFound)
					return logDebug("**WARNING: No Contact found of type: "+pContactType),!1
		}
		return peop=cont.getPeople(),addr=peop.getCompactAddress(),newLic.setContactFirstName(cont.getFirstName()),newLic.setContactLastName(cont.getLastName()),newLic.setBusinessName(peop.getBusinessName()),newLic.setAddress1(addr.getAddressLine1()),newLic.setAddress2(addr.getAddressLine2()),newLic.setAddress3(addr.getAddressLine3()),newLic.setCity(addr.getCity()),newLic.setState(addr.getState()),newLic.setZip(addr.getZip()),newLic.setPhone1(peop.getPhone1()),newLic.setPhone2(peop.getPhone2()),newLic.setEMailAddress(peop.getEmail()),newLic.setFax(peop.getFax()),newLic.setAgencyCode(aa.getServiceProviderCode()),newLic.setAuditDate(sysDate),newLic.setAuditID(currentUserID),newLic.setAuditStatus("A"),AInfo["Insurance Co"]&&newLic.setInsuranceCo(AInfo["Insurance Co"]),AInfo["Insurance Amount"]&&newLic.setInsuranceAmount(parseFloat(AInfo["Insurance Amount"])),AInfo["Insurance Exp Date"]&&newLic.setInsuranceExpDate(aa.date.parseDate(AInfo["Insurance Exp Date"])),AInfo["Policy #"]&&newLic.setPolicy(AInfo["Policy #"]),AInfo["Business License #"]&&newLic.setBusinessLicense(AInfo["Business License #"]),AInfo["Business License Exp Date"]&&newLic.setBusinessLicExpDate(aa.date.parseDate(AInfo["Business License Exp Date"])),newLic.setLicenseType(rlpType),null!=addr.getState()?newLic.setLicState(addr.getState()):newLic.setLicState("AK"),newLic.setStateLicense(rlpId),updating?myResult=aa.licenseScript.editRefLicenseProf(newLic):myResult=aa.licenseScript.createRefLicenseProf(newLic),myResult.getSuccess()?(logDebug("Successfully added/updated License No. "+rlpId+", Type: "+rlpType),logMessage("Successfully added/updated License No. "+rlpId+", Type: "+rlpType),!0):(logDebug("**ERROR: can't create ref lic prof: "+myResult.getErrorMessage()),logMessage("**ERROR: can't create ref lic prof: "+myResult.getErrorMessage()),!1)
}
function createRefContactsFromCapContactsAndLink(pCapId,contactTypeArray,ignoreAttributeArray,replaceCapContact,overwriteRefContact,refContactExists){
	var standardChoiceForBusinessRules="REF_CONTACT_CREATION_RULES";
	new Array;
	arguments.length>1&&(ignoreArray=arguments[1]);
	var defaultContactFlag=lookup(standardChoiceForBusinessRules,"Default"),c=aa.people.getCapContactByCapID(pCapId).getOutput(),cCopy=aa.people.getCapContactByCapID(pCapId).getOutput();
	for(var i in c){
		var ruleForRefContactType="U",con=c[i],p=con.getPeople(),contactFlagForType=lookup(standardChoiceForBusinessRules,p.getContactType());
		if((defaultContactFlag||contactFlagForType||!contactTypeArray||exists(p.getContactType(),contactTypeArray))&&(!contactFlagForType&&defaultContactFlag&&(ruleForRefContactType=defaultContactFlag),contactFlagForType&&(ruleForRefContactType=contactFlagForType),!ruleForRefContactType.equals("D"))){
			var refContactType="";
			switch(ruleForRefContactType){
				case"U":refContactType=p.getContactType();
				break;
				case"I":refContactType="Individual";
				break;
				case"O":refContactType="Organization";
				break;
				case"F":refContactType=p.getContactTypeFlag()&&p.getContactTypeFlag().equals("organization")?"Organization":"Individual"
			}
			var refContactNum=con.getCapContactModel().getRefContactNumber();
			if(refContactNum){
				if(overwriteRefContact){
					p.setContactSeqNumber(refContactNum),p.setContactType(refContactType);
					var a=p.getAttributes();
					if(a)for(var ai=a.iterator();
					ai.hasNext();
					){
						var xx=ai.next();
						xx.setContactNo(refContactNum)
					}
					var r=aa.people.editPeopleWithAttribute(p,p.getAttributes());
					r.getSuccess()?logDebug("Successfully refreshed ref contact #"+refContactNum+" with CAP contact data"):logDebug("WARNING: couldn't refresh reference people : "+r.getErrorMessage())
				}
			}
			else{
				var ccmSeq=p.getContactSeqNumber(),existingContact=refContactExists(p),p=cCopy[i].getPeople();
				if(existingContact)refPeopleId=existingContact;
				else{
					var a=p.getAttributes();
					if(a)for(var ai=a.iterator();
						ai.hasNext();
					){
						var xx=ai.next();
						ignoreAttributeArray&&exists(xx.getAttributeName().toUpperCase(),ignoreAttributeArray)&&ai.remove()
					}
					p.setContactType(refContactType);
					var r=aa.people.createPeopleWithAttribute(p,a);
					if(!r.getSuccess()){
						logDebug("WARNING: couldn't create reference people : "+r.getErrorMessage());
						continue
					}
					var p=cCopy[i].getPeople(),refPeopleId=p.getContactSeqNumber();
					logDebug("Successfully created reference contact #"+refPeopleId);
					var getUserResult=aa.publicUser.getPublicUserByEmail(con.getEmail());
					if(getUserResult.getSuccess()&&getUserResult.getOutput()){
						var userModel=getUserResult.getOutput();
						logDebug("createRefContactsFromCapContactsAndLink: Found an existing public user: "+userModel.getUserID()),refPeopleId&&(logDebug("createRefContactsFromCapContactsAndLink: Linking this public user with new reference contact : "+refPeopleId),aa.licenseScript.associateContactWithPublicUser(userModel.getUserSeqNum(),refPeopleId))
					}
				}
				var ccm=aa.people.getCapContactByPK(pCapId,ccmSeq).getOutput().getCapContactModel();
				ccm.setRefContactNumber(refPeopleId),r=aa.people.editCapContact(ccm),r.getSuccess()?logDebug("Successfully linked ref contact "+refPeopleId+" to cap contact "+ccmSeq):logDebug("WARNING: error updating cap contact model : "+r.getErrorMessage())
			}
		}
	}
}
function reversePayment(){
	logDebug("hello")
}
function addToASITable(tableName,tableValues){
	itemCap=capId,arguments.length>2&&(itemCap=arguments[2]);
	var tssmResult=aa.appSpecificTableScript.getAppSpecificTableModel(itemCap,tableName);
	if(!tssmResult.getSuccess())
		return logDebug("**WARNING: error retrieving app specific table "+tableName+" "+tssmResult.getErrorMessage()),!1;
	for(var tssm=tssmResult.getOutput(),tsm=tssm.getAppSpecificTableModel(),fld=tsm.getTableField(),col=tsm.getColumns(),fld_readonly=tsm.getReadonlyField(),coli=col.iterator();
	coli.hasNext();
	)colname=coli.next(),tableValues[colname.getColumnName()]||(logDebug("addToASITable: null or undefined value supplied for column "+colname.getColumnName()+", setting to empty string"),tableValues[colname.getColumnName()]=""),"undefined"!=typeof tableValues[colname.getColumnName()].fieldValue?(fld.add(tableValues[colname.getColumnName()].fieldValue),fld_readonly.add(tableValues[colname.getColumnName()].readOnly)):(fld.add(tableValues[colname.getColumnName()]),fld_readonly.add(null));
	return tsm.setTableField(fld),tsm.setReadonlyField(fld_readonly),addResult=aa.appSpecificTableScript.editAppSpecificTableInfos(tsm,itemCap,currentUserID),addResult.getSuccess()?void logDebug("Successfully added record to ASI Table: "+tableName):(logDebug("**WARNING: error adding record to ASI Table:  "+tableName+" "+addResult.getErrorMessage()),!1)
}
function addASITable(tableName,tableValueArray){
	var itemCap=capId;
	arguments.length>2&&(itemCap=arguments[2]);
	var tssmResult=aa.appSpecificTableScript.getAppSpecificTableModel(itemCap,tableName);
	if(!tssmResult.getSuccess())
		return logDebug("**WARNING: error retrieving app specific table "+tableName+" "+tssmResult.getErrorMessage()),!1;
	var tssm=tssmResult.getOutput(),tsm=tssm.getAppSpecificTableModel(),fld=tsm.getTableField(),fld_readonly=tsm.getReadonlyField();
	for(thisrow in tableValueArray){
		for(var col=tsm.getColumns(),coli=col.iterator();coli.hasNext();){
			var colname=coli.next();
			tableValueArray[thisrow][colname.getColumnName()]||(logDebug("addToASITable: null or undefined value supplied for column "+colname.getColumnName()+", setting to empty string"),tableValueArray[thisrow][colname.getColumnName()]=""),"undefined"!=typeof tableValueArray[thisrow][colname.getColumnName()].fieldValue?(fld.add(tableValueArray[thisrow][colname.getColumnName()].fieldValue),fld_readonly.add(tableValueArray[thisrow][colname.getColumnName()].readOnly)):(fld.add(tableValueArray[thisrow][colname.getColumnName()]),fld_readonly.add(null))
		}
		tsm.setTableField(fld),tsm.setReadonlyField(fld_readonly)
	}
	var addResult=aa.appSpecificTableScript.editAppSpecificTableInfos(tsm,itemCap,currentUserID);
	return addResult.getSuccess()?void logDebug("Successfully added record to ASI Table: "+tableName):(logDebug("**WARNING: error adding record to ASI Table:  "+tableName+" "+addResult.getErrorMessage()),!1)
}
function getLatestScheduledDate(){
	var inspResultObj=aa.inspection.getInspections(capId);
	if(inspResultObj.getSuccess()){
		inspList=inspResultObj.getOutput();
		var array=new Array,j=0;
		for(i in inspList)inspList[i].getInspectionStatus().equals("Scheduled")&&(array[j++]=aa.util.parseDate(inspList[i].getInspection().getScheduledDate()));
		var latestScheduledDate=array[0];
		for(k=0;k<array.length;k++)
			temp=array[k],logDebug("----------array.k---------->"+array[k]),temp.after(latestScheduledDate)&&(latestScheduledDate=temp);
		return latestScheduledDate
	}
	return!1
}
function cntAssocGarageSales(strnum,strname,city,state,zip,cfname,clname){
	var searchCapModel=aa.cap.getCapModel().getOutput(),searchCapModelType=searchCapModel.getCapType();
	searchCapModelType.setGroup("Licenses"),searchCapModelType.setType("Garage-Yard Sale"),searchCapModelType.setSubType("License"),searchCapModelType.setCategory("NA"),searchCapModel.setCapType(searchCapModelType),searchAddressModel=searchCapModel.getAddressModel(),searchAddressModel.setStreetName(strname),gisObject=new com.accela.aa.xml.model.gis.GISObjects,qf=new com.accela.aa.util.QueryFormat;
	var toDate=aa.date.getCurrentDate(),fromDate=aa.date.parseDate("01/01/"+toDate.getYear()),recordCnt=0;message="The applicant has reached the Garage-Sale License limit of 3 per calendar year.<br>",capList=aa.cap.getCapListByCollection(searchCapModel,searchAddressModel,"",fromDate,toDate,qf,gisObject).getOutput();for(x in capList)resultCap=capList[x],resultCapId=resultCap.getCapID(),altId=resultCapId.getCustomID(),resultCapIdScript=aa.cap.createCapIDScriptModel(resultCapId.getID1(),resultCapId.getID2(),resultCapId.getID3()),contact=aa.cap.getCapPrimaryContact(resultCapIdScript).getOutput(),contactFname=contact.getFirstName(),contactLname=contact.getLastName(),contactFname==cfname&&contactLname==clname&&(recordCnt++,message=message+recordCnt+": "+altId+" - "+contactFname+" "+contactLname+" @ "+strnum+" "+strname+"<br>");
	return recordCnt
}
function copyContactsWithAddress(pFromCapId,pToCapId){
	if(null==pToCapId)var vToCapId=capId;
	else var vToCapId=pToCapId;
	var capContactResult=aa.people.getCapContactByCapID(pFromCapId),copied=0;
	if(!capContactResult.getSuccess())
		return logMessage("**ERROR: Failed to get contacts: "+capContactResult.getErrorMessage()),!1;
	var Contacts=capContactResult.getOutput();
	for(yy in Contacts){
		var newContact=Contacts[yy].getCapContactModel(),addressList=(newContact.getPeople(),aa.address.getContactAddressListByCapContact(newContact).getOutput());
		if(newContact.setCapID(vToCapId),aa.people.createCapContact(newContact),newerPeople=newContact.getPeople(),addressList)
			for(add in addressList){
				var transactionAddress=!1;
				if(contactAddressModel=addressList[add].getContactAddressModel(),logDebug("contactAddressModel.getEntityType():"+contactAddressModel.getEntityType()),"CAP_CONTACT"==contactAddressModel.getEntityType()&&(transactionAddress=!0,contactAddressModel.setEntityID(parseInt(newerPeople.getContactSeqNumber()))),transactionAddress){
					var newPK=new com.accela.orm.model.address.ContactAddressPKModel;contactAddressModel.setContactAddressPK(newPK)
				}
				else{
					var Xref=aa.address.createXRefContactAddressModel().getOutput();Xref.setContactAddressModel(contactAddressModel),Xref.setAddressID(addressList[add].getAddressID()),Xref.setEntityID(parseInt(newerPeople.getContactSeqNumber())),Xref.setEntityType(contactAddressModel.getEntityType()),Xref.setCapID(vToCapId),commitAddress=aa.address.createXRefContactAddress(Xref.getXRefContactAddressModel()),commitAddress.getSuccess()&&(commitAddress.getOutput(),logDebug("Copied contact address"))
				}
			}
			copied++,logDebug("Copied contact from "+pFromCapId.getCustomID()+" to "+vToCapId.getCustomID())
	}
	return copied
}
function changeCapContactTypes(origType,newType){
	var vCapId=capId;
	3==arguments.length&&(vCapId=arguments[2]);
	var capContactResult=aa.people.getCapContactByCapID(vCapId),renamed=0;
	if(!capContactResult.getSuccess())
		return logMessage("**ERROR: Failed to get contacts: "+capContactResult.getErrorMessage()),!1;
	var Contacts=capContactResult.getOutput();
	for(yy in Contacts){
		var contact=Contacts[yy].getCapContactModel(),people=contact.getPeople(),contactType=people.getContactType();
		if(aa.print("Contact Type "+contactType),contactType==origType){
			var contactNbr=people.getContactSeqNumber(),editContact=aa.people.getCapContactByPK(vCapId,contactNbr).getOutput();
			editContact.getCapContactModel().setContactType(newType),aa.print("Set to: "+people.getContactType()),renamed++;
			var updContactResult=aa.people.editCapContact(editContact.getCapContactModel());
			logDebug("contact "+updContactResult),logDebug("contact.getSuccess() "+updContactResult.getSuccess()),logDebug("contact.getOutput() "+updContactResult.getOutput()),updContactResult.getOutput(),logDebug("Renamed contact from "+origType+" to "+newType)
		}
	}
	return renamed
}
function checkWorkflowTaskAndStatus(capId,workflowTask,taskStatus){
	var workflowResult=aa.workflow.getTasks(capId);
	if(!workflowResult.getSuccess())
		return aa.print("**ERROR: Failed to get workflow object: "+wfObj),!1;
	wfObj=workflowResult.getOutput();
	for(i in wfObj){
		fTask=wfObj[i];
		var status=fTask.getDisposition(),taskDesc=fTask.getTaskDescription();
		if(null!=status&&null!=taskDesc&&taskDesc.equals(workflowTask)&&status.equals(taskStatus))
		return!0
	}
	return!1
}
function associatedRefContactWithRefLicProf(capIdStr,refLicProfSeq,servProvCode,auditID){
	var contact=getLicenseHolderByLicenseNumber(capIdStr);
	contact&&contact.getRefContactNumber()?linkRefContactWithRefLicProf(parseInt(contact.getRefContactNumber()),refLicProfSeq,servProvCode,auditID):logMessage("**ERROR:cannot find license holder of license")
}
function linkRefContactWithRefLicProf(refContactSeq,refLicProfSeq,servProvCode,auditID){
	if(refContactSeq&&refLicProfSeq&&servProvCode&&auditID){
		var xRefContactEntity=aa.people.getXRefContactEntityModel().getOutput();
		xRefContactEntity.setServiceProviderCode(servProvCode),xRefContactEntity.setContactSeqNumber(refContactSeq),xRefContactEntity.setEntityType("PROFESSIONAL"),xRefContactEntity.setEntityID1(refLicProfSeq);
		var auditModel=xRefContactEntity.getAuditModel();
		auditModel.setAuditDate(new Date),auditModel.setAuditID(auditID),auditModel.setAuditStatus("A"),xRefContactEntity.setAuditModel(auditModel);
		var xRefContactEntityBusiness=aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.XRefContactEntityBusiness").getOutput(),existedModel=xRefContactEntityBusiness.getXRefContactEntityByUIX(xRefContactEntity);
		if(existedModel.getContactSeqNumber())
			logMessage("License professional link to reference contact successfully.");
		else{
			var XRefContactEntityCreatedResult=xRefContactEntityBusiness.createXRefContactEntity(xRefContactEntity);
			XRefContactEntityCreatedResult?logMessage("License professional link to reference contact successfully."):logMessage("**ERROR:License professional failed to link to reference contact.  Reason: "+XRefContactEntityCreatedResult.getErrorMessage())
		}
	}
	else logMessage("**ERROR:Some Parameters are empty")
}
function getConatctAddreeByID(contactID,vAddressType){
	var conArr=new Array,capContResult=aa.people.getCapContactByContactID(contactID);
	if(capContResult.getSuccess()){
		conArr=capContResult.getOutput();
		for(contact in conArr)
			return cont=conArr[contact],getContactAddressByContact(cont.getCapContactModel(),vAddressType)
	}
}
function getContactAddressByContact(contactModel,vAddressType){
	var xrefContactAddressBusiness=aa.proxyInvoker.newInstance("com.accela.aa.aamain.address.XRefContactAddressBusiness").getOutput(),contactAddressArray=xrefContactAddressBusiness.getContactAddressListByCapContact(contactModel);
	for(i=0;i<contactAddressArray.size();i++){
		var contactAddress=contactAddressArray.get(i);
		if(vAddressType.equals(contactAddress.getAddressType()))
			return contactAddress
	}
}
function copyContactAddressToLicProf(contactAddress,licProf){
	contactAddress&&licProf&&(licProf.setAddress1(contactAddress.getAddressLine1()),licProf.setAddress2(contactAddress.getAddressLine2()),licProf.setAddress3(contactAddress.getAddressLine3()),licProf.setCity(contactAddress.getCity()),licProf.setState(contactAddress.getState()),licProf.setZip(contactAddress.getZip()),licProf.getLicenseModel().setCountryCode(contactAddress.getCountryCode()))
}
function associatedLicensedProfessionalWithPublicUser(licnumber,publicUserID){
	var mylicense=aa.licenseScript.getRefLicenseProfBySeqNbr(aa.getServiceProviderCode(),licnumber),puser=aa.publicUser.getPublicUserByPUser(publicUserID);
	puser.getSuccess()&&aa.licenseScript.associateLpWithPublicUser(puser.getOutput(),mylicense.getOutput())
}
function associatedRefContactWithRefLicProf(capIdStr,refLicProfSeq,servProvCode,auditID){
	var contact=getLicenseHolderByLicenseNumber(capIdStr);
	contact&&contact.getRefContactNumber()?linkRefContactWithRefLicProf(parseInt(contact.getRefContactNumber()),refLicProfSeq,servProvCode,auditID):logMessage("**ERROR:cannot find license holder of license")
}
function taskCloseAllAdjustBranchtaskExcept(e,t){
	var n=new Array,r=!1;
	if(arguments.length>2)
		for(var i=2;i<arguments.length;i++)
			n.push(arguments[i]);
		else r=!0;
		var s=aa.workflow.getTasks(capId);
		if(!s.getSuccess())
			return logMessage("**ERROR: Failed to get workflow object: "+s.getErrorMessage()),!1;
		var u,a,h,o=s.getOutput(),l=aa.date.getCurrentDate(),c=" ";
		for(i in o)u=o[i],h=u.getTaskDescription(),a=u.getStepNumber(),r?(aa.workflow.handleDisposition(capId,a,e,l,c,t,systemUserObj,"B"),logMessage("Closing Workflow Task "+h+" with status "+e),logDebug("Closing Workflow Task "+h+" with status "+e)):exists(h,n)||(aa.workflow.handleDisposition(capId,a,e,l,c,t,systemUserObj,"B"),logMessage("Closing Workflow Task "+h+" with status "+e),logDebug("Closing Workflow Task "+h+" with status "+e))
}
function getLicenseHolderByLicenseNumber(capIdStr){
	var capContactResult=aa.people.getCapContactByCapID(capIdStr);
	if(capContactResult.getSuccess()){
		var Contacts=capContactResult.getOutput();
		for(yy in Contacts){
			var contact=Contacts[yy].getCapContactModel(),contactType=contact.getContactType();
			if(contactType.toUpperCase().equals("LICENSE HOLDER")&&contact.getRefContactNumber())
				return contact
		}
	}
}
function taskCloseAllExcept(pStatus,pComment){
	var taskArray=new Array,closeAll=!1;
	if(arguments.length>2)
		for(var i=2;i<arguments.length;i++)
			taskArray.push(arguments[i]);
		else closeAll=!0;
		var workflowResult=aa.workflow.getTasks(capId);
		if(!workflowResult.getSuccess())
			return logMessage("**ERROR: Failed to get workflow object: "+workflowResult.getErrorMessage()),!1;
		var fTask,stepnumber,wftask,wfObj=workflowResult.getOutput(),dispositionDate=aa.date.getCurrentDate(),wfnote=" ";
		for(i in wfObj)fTask=wfObj[i],wftask=fTask.getTaskDescription(),stepnumber=fTask.getStepNumber(),closeAll?(aa.workflow.handleDisposition(capId,stepnumber,pStatus,dispositionDate,wfnote,pComment,systemUserObj,"Y"),logMessage("Closing Workflow Task "+wftask+" with status "+pStatus),logDebug("Closing Workflow Task "+wftask+" with status "+pStatus)):exists(wftask,taskArray)||(aa.workflow.handleDisposition(capId,stepnumber,pStatus,dispositionDate,wfnote,pComment,systemUserObj,"Y"),logMessage("Closing Workflow Task "+wftask+" with status "+pStatus),logDebug("Closing Workflow Task "+wftask+" with status "+pStatus))
}
function feeItemsOnCap(){
	var itemCap=capId;
	arguments.length>0&&(itemCap=arguments[0]);
	var feeResult=aa.fee.getFeeItems(itemCap);
	if(feeResult.getSuccess()){
		var feeObjArr=feeResult.getOutput();
		return feeObjArr.length>0
	}
	return logDebug("**ERROR: getting fee items: "+capContResult.getErrorMessage()),!1
}
function getMostRecentRenewalCapByParentCapID(parentCapid){
	if(null==parentCapid||aa.util.instanceOfString(parentCapid))
		return null;
	var result=aa.cap.getProjectByMasterID(parentCapid,"Renewal",null);
	if(result.getSuccess()){
		if(projectScriptModels=result.getOutput(),null==projectScriptModels||0==projectScriptModels.length)
			return logDebug("ERROR: Failed to get renewal CAP by parent CAPID("+parentCapid+")"),null;
		var latestRenewalCapID,latestDate=new Date(1900,0,1);
		for(var idx in projectScriptModels){
			var thisChild=projectScriptModels[idx],capIDModel=thisChild.getCapID(),renewalCap=aa.cap.getCap(capIDModel).getOutput(),createdDate=convertDate(renewalCap.getFileDate());
			createdDate>latestDate&&"Pending"==renewalCap.capStatus&&(latestDate=createdDate,latestRenewalCapID=renewalCap.getCapID())
		}
		return latestRenewalCapID
	}
	return logDebug("ERROR: Failed to get renewal CAP by parent CAP("+parentCapid+") : "+result.getErrorMessage()),null
}
function getContactByTypeAA(conType,capId){
	var contactArray=getPeople(capId);
	for(thisContact in contactArray)
		if(contactArray[thisContact].getCapContactModel().getContactType().toUpperCase()==conType.toUpperCase())
			return contactArray[thisContact].getCapContactModel();
		return!1
}
function rentalLicenseExpDate(){
	try{
		var currDate=new Date,newExpDate=new Date;
		newExpDate=11==currDate.getMonth()?new Date(currDate.getFullYear()+2,0,1):new Date(currDate.getFullYear()+1,0,1);
		var newExpDateString=newExpDate.getMonth()+1+"/"+newExpDate.getDate()+"/"+newExpDate.getFullYear();
		return logDebug("New expiration date for rental license: "+newExpDateString),newExpDateString
	}
	catch(err){showMessage=!0,comment("Error on custom function setRentalLicenseExpDate(). Please contact administrator. Err: "+err)}
}
function bldScriptBLD_07addHistPropCond(){
	try{
		var conditionType="Building Plans",conditionName="Historic Commission Approval Required",parcelAttr=new Array;
		loadAddressAttributes(parcelAttr),logDebug("Historic Preservation: "+parcelAttr["AddressAttribute.HISTORIC PRESERVATION"]),void 0!=parcelAttr["AddressAttribute.HISTORIC PRESERVATION"]?"YES"==parcelAttr["AddressAttribute.HISTORIC PRESERVATION"].toUpperCase()&&(logDebug("Adding standard condition "+conditionName),addStdCondition(conditionType,conditionName)):logDebug("WARNING: Address Attribute Historic Preservation is undefined")
	}
	catch(err){showMessage=!0,comment("Error on custom function bldScriptBLD_07addHistPropCond(). Err: "+err)}
}
function bldScript_06addAddressLockCond(){
	logDebug("bldScript_06addAddressLockCond() started.");
	try{
		var conditionType="Building Permit",conditionName="Parcel Lock",impactCode="",condStatus="Applied",auditStatus="A",displayNotice="Y",parcelAttr=new Array;
		loadParcelAttributes(parcelAttr);
		var newCondModel=aa.capCondition.getNewConditionScriptModel().getOutput();
		newCondModel.setCapID(capId),newCondModel.setConditionType(conditionType),newCondModel.setConditionStatus(condStatus),newCondModel.setEffectDate(sysDate),newCondModel.setIssuedDate(sysDate),newCondModel.setIssuedByUser(systemUserObj),newCondModel.setStatusByUser(systemUserObj),newCondModel.setAuditID(currentUserID),newCondModel.setAuditStatus(auditStatus),newCondModel.setDisplayConditionNotice(displayNotice);
		var lockOrNotice=parcelAttr["ParcelAttribute.LOCK"],conditionComments=parcelAttr["ParcelAttribute.LNCOMMENTS"];
		void 0!=lockOrNotice?(appMatch("Building/Right of Way/NA/NA")||(logDebug("For a license or building permit"),"L"==lockOrNotice.toUpperCase()?impactCode="Lock":"N"==lockOrNotice.toUpperCase()&&(impactCode="Notice"),matches(lockOrNotice,"L","N")&&(logDebug("Lock or Notice: "+lockOrNotice),newCondModel.setConditionDescription(conditionName),newCondModel.setLongDescripton(conditionComments),newCondModel.setImpactCode(impactCode),aa.capCondition.createCapCondition(newCondModel))),appMatch("Building/Right of Way/NA/NA")&&(logDebug("For right of way permit"),matches(lockOrNotice,"L","N")&&(logDebug("Lock or Notice: "+lockOrNotice),impactCode="Notice",newCondModel.setConditionDescription(conditionName),newCondModel.setLongDescripton(conditionComments),newCondModel.setImpactCode(impactCode),aa.capCondition.createCapCondition(newCondModel)))):logDebug("WARNING: Parcel Attribute Lock Or Notice is undefined")
	}
	catch(err){showMessage=!0,comment("Error on custom function bldScript_06addAddressLockCond(). Err: "+err)}
}
var scriptRoot=this,bs=bs||{};

(function(){
	var root=this;
	root.version="1.0.0.0";
	var constants=root.constants={
		debug:!!matches(currentUserID,"BYRNESCRIPTS","BYRNE"),reportsAvail:!0,emailEmailRedirectTo:"null"==lookup("DBQ EMAIL REDIRECT TO","emailRedirectTo")?"":"accelamanatee@yahoo.com",defaultEmailSender:"noreply@byrnesoftware.com",scriptReturnCode:{proceed:"0",stopPrevPage:"1",stopmainMenu:"2",stopPageDesig:"3",stopLogout:"4"},emailErrorTo:"cvm@byrnesoftware.com"
	},
	batch=root.batch={};
	(function(){
		var root=this;
		// Byrne's Rental License Renewal, Step 1, run from a batch script
		// Compiles records within specified expiration range into recs[] 
		root.RenewalRecord_RL_06=function(){
			
    var idx,
        lic,
        recs = [],
        scriptDate,
        dte,
        br = "<BR />";							// Break Tag;
    
    var emptyGISArray = [];
	var emptyCm1 = aa.cap.getCapModel().getOutput();
    var emptyCt1 = emptyCm1.getCapType();
    emptyCt1.setGroup("Licenses");
    emptyCt1.setType("Business");
    emptyCt1.setSubType("Rental License");
    emptyCt1.setCategory("License");
    emptyCm1.setCapType(emptyCt1);
    emptyCm1.setCapStatus("Active");
    var capModel = emptyCm1;
	
    var recsResult = aa.cap.getCapListByCollection(capModel, null, null, null, null, null, emptyGISArray);
	
	if(recsResult.getSuccess()) recs = recsResult.getOutput();
    else aa.print("Unable to get licenses err: " + recsResult.getErrorMessage() + br);
	
	var newExpDate = new Date(new Date().getFullYear() + 1, 0, 1);
    var newExpDateString = newExpDate.getMonth()+1 + '/' + newExpDate.getDate() + '/' + newExpDate.getFullYear();
	var expAADate = aa.date.parseDate(newExpDateString);
	
    for (var idx in recs) {
        lic = aa.expiration.getLicensesByCapID(recs[idx].capID).getOutput();

        if (lic) {
            try {
                if (lic.getExpDate()) {
                    scriptDate = lic.getExpDate();
                    dte = new Date(scriptDate.getMonth() + "/" + scriptDate.getDayOfMonth() + "/" + scriptDate.getYear());
                    aa.print("Record - " + recs[idx].capID.getCustomID() + '---- Exp date - ' + dte + br);

					//if(recs[idx].capID.getCustomID() != 'RL18-0010') continue;
                    aa.print('passed all tests' + br);
                    lic.setExpStatus("About to Expire");
					lic.setExpDate(expAADate);
                    aa.expiration.editB1Expiration(lic.getB1Expiration());
                    aa.print('going to update task' + br);
                    aa.print("recs[idx].capID: " + recs[idx].capID + br);
                    updateTask("License Status", "About to Expire", "Updated via Batch RL_06", "", "", recs[idx].capID);
                    
                    // add renewal record
                    aa.print('Calling code for renewal' + br);
                    //First we create a Rental License Renewal
                    renewCapId = createCap("Licenses/Business/Rental License/Renewal", "Rental License Renewal");
                    
                    //If created Successfully
                    if (renewCapId) {
                        //Then we associate the created record to the license
                        renewLinkResult = aa.cap.createRenewalCap(recs[idx].capID, renewCapId, false);
                        
                        if (renewLinkResult) {
                            aa.print("Yes, created the complete renewal: " + renewCapId.getCustomID() + br);
                            //Since the renewal was not creating using the createRenewalRecord we need to copy ASI and ASITs from License to Renewal
                            copyASIFields(recs[idx].capID, renewCapId);
                            copyASITables(recs[idx].capID, renewCapId);
                            copyAddresses(recs[idx].capID, renewCapId);
                            copyContacts(recs[idx].capID, renewCapId);
                            copyOwner(recs[idx].capID, renewCapId);
                            copyParcels(recs[idx].capID, renewCapId);
                    
                            //Adding the fee manually for some reason it is not working here when calling function above
                            // and don't want to break the function since it's working for other records
                            var AInfo = new Array(); // Create array for tokenized variables
                            loadAppSpecific(AInfo, renewCapId); // Add AppSpecific Info
                    
                            var buildings = Number(AInfo['Number of Buildings']),
                            dwellingUnits = Number(AInfo['Number of Dwelling Units']),
                            roomingUnits = Number(AInfo['Number of Rooming Units']),
							occupUnits = Number(AInfo['Number of Owner Occupied Units or Units Not Available for Rent']),
                            totalFee = 0;
							
                            totalFee = ((25 * buildings) + (20 * dwellingUnits) + (10 * roomingUnits)) - (20 * occupUnits);
                            totalFee = parseFloat(totalFee).toFixed(); //removed Fixed nbr to round
                    
                            aa.print("totalFee: " + totalFee + br);
                            feeSeq = addFee('LIC_RA_01', 'LIC_RENT', 'FINAL', totalFee, "Y", renewCapId);
                        }
                        else
                            aa.print("unable to link the renewed cap to the license" + br);
                    }
                    else
                        aa.print("Unable to create renewal cap" + br);
                    //End creating renewal record
                    aa.print('SUCCESS' + br);
				}
            } catch (ex) {  //licensse without renewal dates blow up
                aa.print(recs[idx].capID.getCustomID() + ' has no renewal info' + br);
            }
        }
    }
		},
		//Collecting information? Doesn't seem to actually do anything
		root.RenewalNotice_RL_07=function(){
			var idx,lic,scriptDate,dte,$iTrc=bs.utils.debug.ifTracer,$utils=bs.utils,beginDate=new Date((new Date).getFullYear(),0,1),recs=[];
			recs=aa.cap.getByAppType("Licenses","Business","Rental License","License").getOutput();
			for(var idx in recs)
				if(convertDate(recs[idx].getFileDate())>$utils.date.dateAdd("d",-395,new Date)&&(lic=aa.expiration.getLicensesByCapID(recs[idx].capID).getOutput()))
					try{
						lic.getExpDate&&lic.getExpDate()&&(scriptDate=lic.getExpDate(),dte=new Date(scriptDate.getMonth()+"/"+scriptDate.getDayOfMonth()+"/"+scriptDate.getYear()),aa.print("ID = "+recs[idx].capID.getCustomID()),aa.print("lic.getExpStatus() = "+lic.getExpStatus()),aa.print("dte = "+dte),aa.print("beginDate = "+beginDate),aa.print(dte<=beginDate),$iTrc(dte<=beginDate&&"About to Expire"==lic.getExpStatus(),recs[idx].capID.getCustomID()+" has a expiration date within range & proper status")&&(aa.print(recs[idx].capID),updateTask("License Status","Renewal Notice Sent","Updated via Batch RL_07","","",recs[idx].capID),aa.print("Success")))
					}
					catch(ex){aa.print(ex.message),aa.print(recs[idx].capID.getCustomID()+" has no renewal info")}
		},
		//
		root.RenewalPenalty_RL_08=function(){
			var idx,lic,scriptDate,dte,feeSeq,licHolderContact,$iTrc=bs.utils.debug.ifTracer,$utils=bs.utils,recs=(new Date((new Date).getFullYear(),0,1),[]),br="<BR />",currentDate=new Date;
			currentDate.setHours(0,0,0,0),recs=aa.cap.getByAppType("Licenses","Business","Rental License","License").getOutput(),aa.print("Current Date: "+currentDate+br);
			for(var idx in recs)
				if(convertDate(recs[idx].getFileDate())>$utils.date.dateAdd("d",-395,new Date)&&(lic=aa.expiration.getLicensesByCapID(recs[idx].capID).getOutput()))
					try{
						if(lic.getExpDate&&lic.getExpDate()){
							scriptDate=lic.getExpDate(),dte=new Date(scriptDate.getMonth()+"/"+scriptDate.getDayOfMonth()+"/"+scriptDate.getYear());
							var licCapId=recs[idx].capID,licWfStatus=taskStatus("License Status",null,licCapId);
							if(aa.print("Record - "+recs[idx].capID.getCustomID()+"---- Exp date - "+dte+" and wfStatus "+licWfStatus+br),$iTrc(dte.getTime()<currentDate.getTime()&&matches(licWfStatus,"About to Expire","Renewal Notice Sent"),recs[idx].capID.getCustomID()+" has a expiration date of before the current date & about to expire"+br)){
								aa.print("passed all tests"),updateTask("License Status","Penalty Notice","Updated via Batch RL_08","","",recs[idx].capID);
								var renewalCapId=getMostRecentRenewalCapByParentCapID(licCapId);
								if(renewalCapId){
									renewalCapId=aa.cap.getCapID(renewalCapId.getID1(),renewalCapId.getID2(),renewalCapId.getID3()).getOutput();
									var renewalAltId=renewalCapId.getCustomID();
									aa.print("renewalCapId: "+renewalCapId),aa.print("renewalAltId: "+renewalAltId),aa.print("Will try to add penalty fee to renewalCapId: "+renewalCapId+br),feeSeq=addFee("LIC_RA_12","LIC_RENT","FINAL",1,"Y",renewalCapId)
								}
								else aa.print("ERROR: Unable to get renewalCapId"+br);
								if(licHolderContact=getContactByTypeAA("License Holder",licCapId),licHolderContact&&null!=licHolderContact.email){
									aa.print("-----> License Holder Email: "+licHolderContact.email+br);
									var capIdStr=String(licCapId.getID1()+"-"+licCapId.getID2()+"-"+licCapId.getID3());
									aa.print("-----> capIdStr: "+capIdStr+br);
									var reportArray=new Array,reportName="Penalty Notice",report=aa.reportManager.getReportInfoModelByName(reportName),reportResult=null,hashMapReportParameters=aa.util.newHashMap();
									if(hashMapReportParameters.put("p1Value",String(licCapId.getCustomID())),report.getSuccess()){
										aa.print("-----> working on generating the report."+br),report=report.getOutput(),report.setModule("*"),report.setCapId(licCapId),report.setReportParameters(hashMapReportParameters);
										var ed1=report.getEDMSEntityIdModel();ed1.setCapId(licCapId),ed1.setAltId(licCapId.getCustomID()),

										report.setEDMSEntityIdModel(ed1),reportResult=aa.reportManager.getReportResult(report)
									}
									if(reportResult)
										if(aa.print("-----> working on saving report to disk and add to array for emailing."+br),reportResult=reportResult.getOutput(),null!=reportResult){
											var reportFile=aa.reportManager.storeReportToDisk(reportResult);
											reportFile=reportFile.getOutput(),reportArray.push(reportFile)
										}
										else aa.print("WARNING: Report file is null."+br);
										else aa.print("WARNING: Report file was not created."+br);
										var emailOptions=new Array;
										emailOptions.subj="Renewal is overdue",emailOptions.body="Your renewal is overdue.  Please view the attached letter.\n\nThis is an automated message from the City of Dubuque Housing Department",emailOptions.files=reportArray,aa.print("-----> Trying to send email."+br),$utils.accela.emailContacts("License Holder",emailOptions,licCapId)
								}
								else aa.print("WARNING: No license holder contact available or contact does not have an email address.")
							}
						}
					}
					catch(ex){aa.print(recs[idx].capID.getCustomID()+" has no renewal info"),aa.print("ERROR: "+ex)}
		},
		root.inspectionduestatus_RL09=function(){
			var idx,recs=[],today=new Date;
			recs=aa.cap.getByAppType("Licenses","Business","Rental License","License").getOutput();
			for(var idx in recs)if(scriptDate=getAppSpecific("Next Required Inspection Date",recs[idx].getCapID()),aa.print("ID = "+recs[idx].capID.getCustomID()),aa.print("scriptDate = "+scriptDate),null!=scriptDate){var dte=new Date(scriptDate);
			aa.print("dte = "+dte),"Active"==recs[idx].getCapStatus()&&dte<today&&(updateTask("License Status","Inspection Due","Updated via Batch RL_09","","",recs[idx].getCapID()),aa.print("Success"))}
		}
	}).call(batch);
		var proRateApplicationFee_RL01 = root.proRateApplicationFee_RL01 = function () {
            var $utils = bs.utils,
				buildings = Number(AInfo['Number of Buildings']),
                dwellingUnits = Number(AInfo['Number of Dwelling Units']),
                roomingUnits = Number(AInfo['Number of Rooming Units']),
				occupUnits = Number(AInfo['Number of Owner Occupied Units or Units Not Available for Rent']),
                feeMonths, 
                totalFee = 0,
				annualFee = 0;

            showDebug = bs.constants.debug;
            $utils.debug.assert(true,'proRateApplicationFee_RL01() started');

            feeMonths = $utils.date.monthsDiff(new Date(), new Date(new Date().getFullYear() + 1, 0, 1))+1; //including current month in calculation
            $utils.debug.assert(true, "feeMonths = " + feeMonths);
			annualFee = ((25 * buildings) + (20 * dwellingUnits) + (10 * roomingUnits)) - (20 * occupUnits)
            totalFee = (annualFee / 12) * feeMonths;
            totalFee = parseFloat(totalFee).toFixed(); //removed Fixed nbr to round

            $utils.debug.assert(true, 'adding fee LIC_RA_01: ' + totalFee);
            feeSeq = addFee('LIC_RA_01', 'LIC_RENT', 'FINAL', totalFee, "Y")
            $utils.debug.assert(true, 'added fee LIC_RA_01: ' + totalFee);

        };
	var emse=root.emse={};
	(function(){
		var root=this;
		//Sets Permit issuance fee (if not already set)
		root.permitIssuanceFee_BLD01=function(){
			var $iTrc=bs.utils.debug.ifTracer,$utils=bs.utils,feeSeq=null,doesFeeExist=!1,type=appTypeArray[1].toUpperCase();
			if(showDebug=bs.constants.debug,$utils.debug.assert(!0,"permitIssuanceFee_BLD01() started"),(feeExists("BLD_03","INVOICED","NEW")||feeExists("M_01","INVOICED","NEW")||feeExists("E_01","INVOICED","NEW")||feeExists("P_01","INVOICED","NEW")||feeExists("SL_02","INVOICED","NEW"))&&(doesFeeExist=!0),aa.print(doesFeeExist),$iTrc(isTaskActive("Permit Issuance")&&"Permit Issuance"!=wfTask&&!doesFeeExist,"Active Task = Permit Issuance.....wfTask != Permit Issuance....fee not new or invoiced"))
			switch(type.slice(0)){
				case"BUILDING":feeSeq=addFee("BLD_03","BLD_BUILDING","FINAL",1,"Y");
				break;
				case"MECHANICAL":feeSeq=addFee("M_01","BLD_MECH","FINAL",1,"Y");
				break;
				case"ELECTRICAL":feeSeq=addFee("E_01","BLD_ELECTRICAL","FINAL",1,"Y");
				break;
				case"PLUMBING":feeSeq=addFee("P_01","BLD_PLUMB","FINAL",1,"Y");
				break;
				case"SOLAR":feeSeq=addFee("SL_02","BLD_SOLAR","FINAL",1,"Y")
			}
		},
		// If Fee Balance == 0, permit cannot be issued (why does this not work on Plumbing?)
		root.feePaymentVerification_BLD02=function(){
			var fees,idx,feeItem,$iTrc=bs.utils.debug.ifTracer,$utils=bs.utils,balance=0;
			if(showDebug=bs.constants.debug,$utils.debug.assert(!0,"feePaymentVerification_BLD02() started"),$iTrc("Permit Issuance"==wfTask&&"Issued"==wfStatus,"Workflow-Task Match")){
				fees=aa.fee.getFeeItems(capId).getOutput();
				for(var idx in fees)feeItem=fees[idx],balance+=$utils.accela.overrides.feeBalance(feeItem.getFeeCod());
				$utils.debug.assert(!0,"fee balance: "+balance),balance>0&&(message=debug="Validation Failed. Unpaid fees exist.")
			}
			cancel=!!message.length,aa.env.setValue("ScriptReturnCode",message.length?bs.constants.scriptReturnCode.stopPrevPage:bs.constants.scriptReturnCode.proceed),aa.env.setValue("ScriptReturnMessage",message)
		},
		root.bldCalcCommercialPermitFee_BLD03=function(){
			function calcCommercialFee(){
				var fee,feeValues,feeString="",feeAddString="",feesLookup="DBQ_CommercialFee",scValue="";
				if(valueOfWorkPermitted<=500)feeString=lookup(feesLookup,"000500");
					else if(valueOfWorkPermitted<=1e3)feeString=lookup(feesLookup,"001000");
					else if(valueOfWorkPermitted<=1500)feeString=lookup(feesLookup,"001500");
					else if(valueOfWorkPermitted<=2e3)feeString=lookup(feesLookup,"002000");
					else if(valueOfWorkPermitted<=3e3)feeString=lookup(feesLookup,"003000");
					else if(valueOfWorkPermitted<=4e3)feeString=lookup(feesLookup,"004000");
					else if(valueOfWorkPermitted<=5e3)feeString=lookup(feesLookup,"005000");
					else if(valueOfWorkPermitted<=6e3)feeString=lookup(feesLookup,"006000");
					else if(valueOfWorkPermitted<=7e3)feeString=lookup(feesLookup,"007000");
					else if(valueOfWorkPermitted<=8e3)feeString=lookup(feesLookup,"008000");
					else if(valueOfWorkPermitted<=9e3)feeString=lookup(feesLookup,"009000");
					else if(valueOfWorkPermitted<=1e4)feeString=lookup(feesLookup,"010000");
					else if(valueOfWorkPermitted<=11e3)feeString=lookup(feesLookup,"011000");
					else if(valueOfWorkPermitted<=12e3)feeString=lookup(feesLookup,"012000");
					else if(valueOfWorkPermitted<=13e3)feeString=lookup(feesLookup,"013000");
					else if(valueOfWorkPermitted<=14e3)feeString=lookup(feesLookup,"014000");
					else if(valueOfWorkPermitted<=15e3)feeString=lookup(feesLookup,"015000");
					else if(valueOfWorkPermitted<=16e3)feeString=lookup(feesLookup,"016000");
					else if(valueOfWorkPermitted<=17e3)feeString=lookup(feesLookup,"017000");
					else if(valueOfWorkPermitted<=18e3)feeString=lookup(feesLookup,"018000");
					else if(valueOfWorkPermitted<=19e3)feeString=lookup(feesLookup,"019000");
					else if(valueOfWorkPermitted<=2e4)feeString=lookup(feesLookup,"020000");
					else if(valueOfWorkPermitted<=21e3)feeString=lookup(feesLookup,"021000");
					else if(valueOfWorkPermitted<=22e3)feeString=lookup(feesLookup,"022000");
					else if(valueOfWorkPermitted<=23e3)feeString=lookup(feesLookup,"023000");
					else if(valueOfWorkPermitted<=24e3)feeString=lookup(feesLookup,"024000");
					else if(valueOfWorkPermitted<=25e3)feeString=lookup(feesLookup,"025000");
					else if(valueOfWorkPermitted<=26e3)feeString=lookup(feesLookup,"026000");
					else if(valueOfWorkPermitted<=27e3)feeString=lookup(feesLookup,"027000");
					else if(valueOfWorkPermitted<=28e3)feeString=lookup(feesLookup,"028000");
					else if(valueOfWorkPermitted<=29e3)feeString=lookup(feesLookup,"029000");
					else if(valueOfWorkPermitted<=3e4)feeString=lookup(feesLookup,"030000");
					else if(valueOfWorkPermitted<=31e3)feeString=lookup(feesLookup,"031000");
					else if(valueOfWorkPermitted<=32e3)feeString=lookup(feesLookup,"032000");
					else if(valueOfWorkPermitted<=33e3)feeString=lookup(feesLookup,"033000");
					else if(valueOfWorkPermitted<=34e3)feeString=lookup(feesLookup,"034000");
					else if(valueOfWorkPermitted<=35e3)feeString=lookup(feesLookup,"035000");
					else if(valueOfWorkPermitted<=36e3)feeString=lookup(feesLookup,"036000");
					else if(valueOfWorkPermitted<=37e3)feeString=lookup(feesLookup,"037000");
					else if(valueOfWorkPermitted<=38e3)feeString=lookup(feesLookup,"038000");
					else if(valueOfWorkPermitted<=39e3)feeString=lookup(feesLookup,"039000");
					else if(valueOfWorkPermitted<=4e4)feeString=lookup(feesLookup,"040000");
					else if(valueOfWorkPermitted<=41e3)feeString=lookup(feesLookup,"041000");
					else if(valueOfWorkPermitted<=42e3)feeString=lookup(feesLookup,"042000");
					else if(valueOfWorkPermitted<=43e3)feeString=lookup(feesLookup,"043000");
					else if(valueOfWorkPermitted<=44e3)feeString=lookup(feesLookup,"044000");
					else if(valueOfWorkPermitted<=45e3)feeString=lookup(feesLookup,"045000");
					else if(valueOfWorkPermitted<=46e3)feeString=lookup(feesLookup,"046000");
					else if(valueOfWorkPermitted<=47e3)feeString=lookup(feesLookup,"047000");
					else if(valueOfWorkPermitted<=48e3)feeString=lookup(feesLookup,"048000");
					else if(valueOfWorkPermitted<=49e3)feeString=lookup(feesLookup,"049000");
					else if(valueOfWorkPermitted<=5e4)feeString=lookup(feesLookup,"050000");
					else{
						if(valueOfWorkPermitted<=1e5)
							return scValue=lookup(feesLookup,"100000"),feeValues=scValue.split("|"),feeString=feeValues[0],feeAddString=feeValues[1],fee=parseFloat(feeString)+Math.floor((valueOfWorkPermitted-5e4)/1e3)*parseFloat(feeAddString);
						if(valueOfWorkPermitted<=5e5)
							return scValue=lookup(feesLookup,"500000"),feeValues=scValue.split("|"),feeString=feeValues[0],feeAddString=feeValues[1],fee=parseFloat(feeString)+Math.floor((valueOfWorkPermitted-1e5)/1e4)*parseFloat(feeAddString);
						if(valueOfWorkPermitted>5e5)
							return scValue=lookup(feesLookup,"500001"),feeValues=scValue.split("|"),feeString=feeValues[0],feeAddString=feeValues[1],fee=parseFloat(feeString)+Math.floor((valueOfWorkPermitted-5e5)/1e4)*parseFloat(feeAddString)
					}
					return fee=void 0!=feeString?parseFloat(feeString):0
			}
					var key,$iTrc=bs.utils.debug.ifTracer,$utils=bs.utils,valueOfWorkPermitted=Number(AInfo["Value of Work Permitted"]),fee=calcCommercialFee(),feeObjArr=[];
					showDebug=bs.constants.debug,$utils.debug.assert(!0,"bldCalcCommercialPermitFee_BLD03() started"),feeObjArr=aa.fee.getFeeItems(capId,null,null).getOutput();
			for(key in feeObjArr)
				$iTrc("BLD_01"==feeObjArr[key].getFeeCod().toUpperCase()&&"BLD_BUILDING"==feeObjArr[key].getF4FeeItemModel().getFeeSchudle().toUpperCase(),"Fee = BLD_01... Schedule = BLD_BUILDING")&&updateFee("BLD_01","BLD_BUILDING","FINAL",fee,"N")
		},
		root.bldCalcResidentialPermitFee_BLD04=function(){
			function calcResidentialFee(){
				var fee,feeValues,feeAddString="",feeString="",feesLookup="DBQ_ResidentialFee",scValue="";
				if(valueOfWorkPermitted<=500)feeString=lookup(feesLookup,"000500");
				else if(valueOfWorkPermitted<=600)feeString=lookup(feesLookup,"000600");
				else if(valueOfWorkPermitted<=700)feeString=lookup(feesLookup,"000700");
				else if(valueOfWorkPermitted<=800)feeString=lookup(feesLookup,"000800");
				else if(valueOfWorkPermitted<=900)feeString=lookup(feesLookup,"000900");
				else if(valueOfWorkPermitted<=1e3)feeString=lookup(feesLookup,"001000");
				else if(valueOfWorkPermitted<=1100)feeString=lookup(feesLookup,"001100");
				else if(valueOfWorkPermitted<=1200)feeString=lookup(feesLookup,"001200");
				else if(valueOfWorkPermitted<=1300)feeString=lookup(feesLookup,"001300");
				else if(valueOfWorkPermitted<=1400)feeString=lookup(feesLookup,"001400");
				else if(valueOfWorkPermitted<=1500)feeString=lookup(feesLookup,"001500");
				else if(valueOfWorkPermitted<=1600)feeString=lookup(feesLookup,"001600");
				else if(valueOfWorkPermitted<=1700)feeString=lookup(feesLookup,"001700");
				else if(valueOfWorkPermitted<=1800)feeString=lookup(feesLookup,"001800");
				else if(valueOfWorkPermitted<=1900)feeString=lookup(feesLookup,"001900");
				else if(valueOfWorkPermitted<=2e3)feeString=lookup(feesLookup,"002000");
				else if(valueOfWorkPermitted<=3e3)feeString=lookup(feesLookup,"003000");
				else if(valueOfWorkPermitted<=4e3)feeString=lookup(feesLookup,"004000");
				else if(valueOfWorkPermitted<=5e3)feeString=lookup(feesLookup,"005000");
				else if(valueOfWorkPermitted<=6e3)feeString=lookup(feesLookup,"006000");
				else if(valueOfWorkPermitted<=7e3)feeString=lookup(feesLookup,"007000");
				else if(valueOfWorkPermitted<=8e3)feeString=lookup(feesLookup,"008000");
				else if(valueOfWorkPermitted<=9e3)feeString=lookup(feesLookup,"009000");
				else if(valueOfWorkPermitted<=1e4)feeString=lookup(feesLookup,"010000");
				else if(valueOfWorkPermitted<=11e3)feeString=lookup(feesLookup,"011000");
				else if(valueOfWorkPermitted<=12e3)feeString=lookup(feesLookup,"012000");
				else if(valueOfWorkPermitted<=13e3)feeString=lookup(feesLookup,"013000");
				else if(valueOfWorkPermitted<=14e3)feeString=lookup(feesLookup,"014000");
				else if(valueOfWorkPermitted<=15e3)feeString=lookup(feesLookup,"015000");
				else if(valueOfWorkPermitted<=16e3)feeString=lookup(feesLookup,"016000");
				else if(valueOfWorkPermitted<=17e3)feeString=lookup(feesLookup,"017000");
				else if(valueOfWorkPermitted<=18e3)feeString=lookup(feesLookup,"018000");
				else if(valueOfWorkPermitted<=19e3)feeString=lookup(feesLookup,"019000");
				else if(valueOfWorkPermitted<=2e4)feeString=lookup(feesLookup,"020000");
				else if(valueOfWorkPermitted<=21e3)feeString=lookup(feesLookup,"021000");
				else if(valueOfWorkPermitted<=22e3)feeString=lookup(feesLookup,"022000");
				else if(valueOfWorkPermitted<=23e3)feeString=lookup(feesLookup,"023000");
				else if(valueOfWorkPermitted<=24e3)feeString=lookup(feesLookup,"024000");
				else if(valueOfWorkPermitted<=25e3)feeString=lookup(feesLookup,"025000");
				else if(valueOfWorkPermitted<=26e3)feeString=lookup(feesLookup,"026000");
				else if(valueOfWorkPermitted<=27e3)feeString=lookup(feesLookup,"027000");
				else if(valueOfWorkPermitted<=28e3)feeString=lookup(feesLookup,"028000");
				else if(valueOfWorkPermitted<=29e3)feeString=lookup(feesLookup,"029000");
				else if(valueOfWorkPermitted<=3e4)feeString=lookup(feesLookup,"030000");
				else if(valueOfWorkPermitted<=31e3)feeString=lookup(feesLookup,"031000");
				else if(valueOfWorkPermitted<=32e3)feeString=lookup(feesLookup,"032000");
				else if(valueOfWorkPermitted<=33e3)feeString=lookup(feesLookup,"033000");
				else if(valueOfWorkPermitted<=34e3)feeString=lookup(feesLookup,"034000");
				else if(valueOfWorkPermitted<=35e3)feeString=lookup(feesLookup,"035000");
				else if(valueOfWorkPermitted<=36e3)feeString=lookup(feesLookup,"036000");
				else if(valueOfWorkPermitted<=37e3)feeString=lookup(feesLookup,"037000");
				else if(valueOfWorkPermitted<=38e3)feeString=lookup(feesLookup,"038000");
				else if(valueOfWorkPermitted<=39e3)feeString=lookup(feesLookup,"039000");
				else if(valueOfWorkPermitted<=4e4)feeString=lookup(feesLookup,"040000");
				else if(valueOfWorkPermitted<=41e3)feeString=lookup(feesLookup,"041000");
				else if(valueOfWorkPermitted<=42e3)feeString=lookup(feesLookup,"042000");
				else if(valueOfWorkPermitted<=43e3)feeString=lookup(feesLookup,"043000");
				else if(valueOfWorkPermitted<=44e3)feeString=lookup(feesLookup,"044000");
				else if(valueOfWorkPermitted<=45e3)feeString=lookup(feesLookup,"045000");
				else if(valueOfWorkPermitted<=46e3)feeString=lookup(feesLookup,"046000");
				else if(valueOfWorkPermitted<=47e3)feeString=lookup(feesLookup,"047000");
				else if(valueOfWorkPermitted<=48e3)feeString=lookup(feesLookup,"048000");
				else if(valueOfWorkPermitted<=49e3)feeString=lookup(feesLookup,"049000");
				else if(valueOfWorkPermitted<=5e4)feeString=lookup(feesLookup,"050000");
				else if(valueOfWorkPermitted<=51e3)feeString=lookup(feesLookup,"051000");
				else if(valueOfWorkPermitted<=52e3)feeString=lookup(feesLookup,"052000");
				else if(valueOfWorkPermitted<=53e3)feeString=lookup(feesLookup,"053000");
				else if(valueOfWorkPermitted<=54e3)feeString=lookup(feesLookup,"054000");
				else if(valueOfWorkPermitted<=55e3)feeString=lookup(feesLookup,"055000");
				else if(valueOfWorkPermitted<=56e3)feeString=lookup(feesLookup,"056000");
				else if(valueOfWorkPermitted<=57e3)feeString=lookup(feesLookup,"057000");
				else if(valueOfWorkPermitted<=58e3)feeString=lookup(feesLookup,"058000");
				else if(valueOfWorkPermitted<=59e3)feeString=lookup(feesLookup,"059000");
				else if(valueOfWorkPermitted<=6e4)feeString=lookup(feesLookup,"060000");
				else if(valueOfWorkPermitted<=61e3)feeString=lookup(feesLookup,"061000");
				else if(valueOfWorkPermitted<=62e3)feeString=lookup(feesLookup,"062000");
				else if(valueOfWorkPermitted<=63e3)feeString=lookup(feesLookup,"063000");
				else if(valueOfWorkPermitted<=64e3)feeString=lookup(feesLookup,"064000");
				else if(valueOfWorkPermitted<=65e3)feeString=lookup(feesLookup,"065000");
				else if(valueOfWorkPermitted<=66e3)feeString=lookup(feesLookup,"066000");
				else if(valueOfWorkPermitted<=67e3)feeString=lookup(feesLookup,"067000");
				else if(valueOfWorkPermitted<=68e3)feeString=lookup(feesLookup,"068000");
				else if(valueOfWorkPermitted<=69e3)feeString=lookup(feesLookup,"069000");
				else if(valueOfWorkPermitted<=7e4)feeString=lookup(feesLookup,"070000");
				else if(valueOfWorkPermitted<=71e3)feeString=lookup(feesLookup,"071000");
				else if(valueOfWorkPermitted<=72e3)feeString=lookup(feesLookup,"072000");
				else if(valueOfWorkPermitted<=73e3)feeString=lookup(feesLookup,"073000");
				else if(valueOfWorkPermitted<=74e3)feeString=lookup(feesLookup,"074000");
				else if(valueOfWorkPermitted<=75e3)feeString=lookup(feesLookup,"075000");
				else if(valueOfWorkPermitted<=76e3)feeString=lookup(feesLookup,"076000");
				else if(valueOfWorkPermitted<=77e3)feeString=lookup(feesLookup,"077000");
				else if(valueOfWorkPermitted<=78e3)feeString=lookup(feesLookup,"078000");
				else if(valueOfWorkPermitted<=79e3)feeString=lookup(feesLookup,"079000");
				else if(valueOfWorkPermitted<=8e4)feeString=lookup(feesLookup,"080000");
				else if(valueOfWorkPermitted<=81e3)feeString=lookup(feesLookup,"081000");
				else if(valueOfWorkPermitted<=82e3)feeString=lookup(feesLookup,"082000");
				else if(valueOfWorkPermitted<=83e3)feeString=lookup(feesLookup,"083000");
				else if(valueOfWorkPermitted<=84e3)feeString=lookup(feesLookup,"084000");
				else if(valueOfWorkPermitted<=85e3)feeString=lookup(feesLookup,"085000");
				else if(valueOfWorkPermitted<=86e3)feeString=lookup(feesLookup,"086000");
				else if(valueOfWorkPermitted<=87e3)feeString=lookup(feesLookup,"087000");
				else if(valueOfWorkPermitted<=88e3)feeString=lookup(feesLookup,"088000");
				else if(valueOfWorkPermitted<=89e3)feeString=lookup(feesLookup,"089000");
				else if(valueOfWorkPermitted<=9e4)feeString=lookup(feesLookup,"090000");
				else if(valueOfWorkPermitted<=91e3)feeString=lookup(feesLookup,"091000");
				else if(valueOfWorkPermitted<=92e3)feeString=lookup(feesLookup,"092000");
				else if(valueOfWorkPermitted<=93e3)feeString=lookup(feesLookup,"093000");
				else if(valueOfWorkPermitted<=94e3)feeString=lookup(feesLookup,"094000");
				else if(valueOfWorkPermitted<=95e3)feeString=lookup(feesLookup,"095000");
				else if(valueOfWorkPermitted<=96e3)feeString=lookup(feesLookup,"096000");
				else if(valueOfWorkPermitted<=97e3)feeString=lookup(feesLookup,"097000");
				else if(valueOfWorkPermitted<=98e3)feeString=lookup(feesLookup,"098000");
				else if(valueOfWorkPermitted<=99e3)feeString=lookup(feesLookup,"099000");
				else if(valueOfWorkPermitted<=1e5)feeString=lookup(feesLookup,"100000");
				else if(valueOfWorkPermitted>1e5)
					return scValue=lookup(feesLookup,"100001"),feeValues=scValue.split("|"),feeString=feeValues[0],feeAddString=feeValues[1],fee=parseFloat(feeString)+Math.ceil((valueOfWorkPermitted-1e5)/1e3)*parseFloat(feeAddString);
				return fee=void 0!=feeString?parseFloat(feeString):0
			}
			var key,$iTrc=bs.utils.debug.ifTracer,$utils=bs.utils,valueOfWorkPermitted=Number(AInfo["Value of Work Permitted"]),fee=calcResidentialFee(),feeObjArr=[];
			showDebug=bs.constants.debug,$utils.debug.assert(!0,"bldCalcResidentialPermitFee_BLD04() started"),feeObjArr=aa.fee.getFeeItems(capId,null,null).getOutput();
			for(key in feeObjArr)$iTrc("BLD_02"==feeObjArr[key].getFeeCod().toUpperCase()&&"BLD_BUILDING"==feeObjArr[key].getF4FeeItemModel().getFeeSchudle().toUpperCase(),"Fee = BLD_01... Schedule = BLD_BUILDING")&&updateFee("BLD_02","BLD_BUILDING","FINAL",fee)
		},
		root.bldgPermitHousingUnitsProposedMoreThenExistingEmail_BLDG05=function(){
			var $iTrc=bs.utils.debug.ifTracer,$utils=bs.utils,msg=(parseInt(String(AInfo["Housing Units Existing"])),parseInt(String(AInfo["Housing Units Proposed"])),""),owners=[];
			showDebug=bs.constants.debug,$utils.debug.assert(!0,"bldgPermitHousingUnitsProposedMoreThenExistingEmail_BLDG05() started"),$iTrc("Application Submittal"==wfTask&&"Application Approved"==wfStatus,"Workflow-Task Match")&&(owners=$utils.accela.people.getOwners(capId).sort(function(a,b){
				var pa=a.primaryOwner;b.primaryOwner;
				return"Y"==pa?0:1
			}),
			msg="The Building Permit, number "+capId.getCustomID()+", has been approved and the number of Units Proposed is greater than the number of units existing <br />",owners.length&&(msg+="Address: "+owners[0].mailAddress1+"<br />",owners[0].mailAddress2&&(msg+=" "+owners[0].mailAddress2+"<br />"),owners[0].mailAddress3&&(msg+=" "+owners[0].mailAddress3+"<br />"),msg+=String(owners[0].getMailCity())+" "+String(owners[0].getMailState())+" "+String(owners[0].getMailZip())+"<br />",msg+="Owner: "+owners[0].ownerFullName),$utils.accela.emailPerson({to:"wwernimo@cityofdubuque.com",subj:"Building Permit Housing Units Notification",body:msg})
			)
		},
		root.SchedulePendingForInspApp=function(){scheduleInspection("Pending",0,"admin",null,"Created as placeholder for Inspector App use")},
		
		
		//is run when LIC_RL_01 (Application Fee) is calculated on a new Rental License Application

		
		//should be run when LIC_RL_01 (Application Fee) is calculated on a renewed Rental License Application
		// not running tho?
		root.rentalLicRenFee_RL01=function(){
			var $utils=(bs.utils.debug.ifTracer,bs.utils),dwellingUnitFee=20,roomingUnitFee=10,buildingUnitFee=25,dwellingUnits=Number(AInfo["Number of Dwelling Units"]),roomingUnits=Number(AInfo["Number of Rooming Units"]),,buildingUnits=Number(AInfo["Number of Building Units"]),ownerUnits=Number(AInfo["Number of Owner Occupied Units or Units Not Available for Rent"]),totalFee=0;
			showDebug=bs.constants.debug,$utils.debug.assert(!0,"rentalLicRenFee_RL01() started"),totalFee=(((buildingUnitFee*buildingUnits)+(dwellingUnitFee*dwellingUnits)+(roomingUnitFee*roomingUnits))-(ownerUnits*20)),totalFee=parseFloat(totalFee).toFixed(),$utils.debug.assert(!0,"adding fee LIC_RA_01:: "+totalFee),$utils.debug.assert(!0,"added fee LIC_RA_01: "+totalFee)
		},
		
		root.inspectionFeeAssigned_RL02=function(){
			var $iTrc=bs.utils.debug.ifTracer,$utils=bs.utils,feeSeq=null,dwellingUnits=Number(AInfo["Number of Dwelling Units"]),roomingUnits=Number(AInfo["Number of Rooming Units"]);
			showDebug=bs.constants.debug,$utils.debug.assert(!0,"inspectionFeeAssigned_RL02() started"),$utils.debug.assert(!0,"adding fee LIC_RA_02: 1"),feeSeq=addFee("LIC_RA_02","LIC_RENT","FINAL",dwellingUnits,"N"),$iTrc("Yes"!=AInfo["Is this a Dormitory?"],"Is this a Dormitory? != Yes")&&0!=roomingUnits&&($utils.debug.assert(!0,"adding fee LIC_RA_03: 1"),feeSeq=addFee("LIC_RA_03","LIC_RENT","FINAL",roomingUnits,"N"))},
		root.fireDeptInspectionFeeAssigned_RL03=function(){
			var $iTrc=bs.utils.debug.ifTracer,$utils=bs.utils,feeSeq=null;
			showDebug=bs.constants.debug,$utils.debug.assert(!0,"fireDeptInspectionFeeAssigned_RL03() started"),$iTrc("Yes"==AInfo["Is this a Dormitory?"],"Is this a Dormitory? == Yes")&&($utils.debug.assert(!0,"adding fee LIC_RA_11: 1"),feeSeq=addFee("LIC_RA_11","LIC_RENT","FINAL",1,"N"))
		},
		root.updateTheLicenseRecord_RL05=function(){
			function setExpDateAndStatus(expDate){
				expDate=11==(new Date).getMonth()?new Date((new Date).getFullYear()+2,0,1):new Date((new Date).getFullYear()+1,0,1),$utils.accela.updateExpirationDateAndStatus(capId,expDate,"Active")
				}
			var $iTrc=bs.utils.debug.ifTracer,$utils=bs.utils;
			showDebug=bs.constants.debug,$utils.debug.assert(!0,"updateTheLicenseRecord_RL05() started"),$iTrc("License Issuance"==wfTask&&"Renewed"==wfStatus,"Workflow-Task Match")&&setExpDateAndStatus()
		},
		root.setNextDueDate_RL10=function(){
			var inspection,strExpDate,$iTrc=bs.utils.debug.ifTracer,$utils=bs.utils;switch(showDebug=bs.constants.debug,$utils.debug.assert(!0,"setNextDueDate_RL10() started"),vEventName.slice(0)){
				case"ApplicationSubmitAfter":strExpDate=$utils.date.formatToMMDDYYYY($utils.date.dateAdd("y",5,new Date)),editAppSpecific("Next Required Inspection Date",strExpDate),$utils.debug.assert(!0,"Set Next Required Inspection Date = "+strExpDate);
				break;
				default:$iTrc(matches(inspType,"RL Inspection","AH Biennial"),"inspType matches Follow-Up XXX")&&$iTrc(matches(inspResult,"Pass","Passed"),"inspResult == 'Passed'")&&(inspection=$utils.accela.inspection.getInspection(capId,inspId),strExpDate=$utils.date.formatToMMDDYYYY($utils.date.dateAdd("y",5,new Date(inspection.inspectionDate.year,inspection.inspectionDate.month-1,inspection.inspectionDate.dayOfMonth))),editAppSpecific("Next Required Inspection Date",strExpDate),$utils.debug.assert(!0,"Set Next Required Inspection Date = "+strExpDate))
				}
			},
		root.setNextDueDateOnLic_RL10=function(licId){
			var strExpDate,$utils=(bs.utils.debug.ifTracer,bs.utils);
			showDebug=bs.constants.debug,$utils.debug.assert(!0,"setNextDueDateOnLic_RL10() started....."),strExpDate=$utils.date.formatToMMDDYYYY($utils.date.dateAdd("y",5,new Date)),editAppSpecific("Next Required Inspection Date",strExpDate,licId),$utils.debug.assert(!0,"Set Next Required Inspection Date = "+strExpDate)
		},
		root.setExpirationDate_RL11=function(){
			var expDate,$utils=(bs.utils.debug.ifTracer,bs.utils);
			showDebug=bs.constants.debug,$utils.debug.assert(!0,"setExpirationDate_RL11() started"),expDate=11==(new Date).getMonth()?new Date((new Date).getFullYear()+2,0,1):new Date((new Date).getFullYear()+1,0,1),$utils.accela.updateExpirationDateAndStatus(capId,expDate,null)
		},
		root.updateFeeQuantity_BLD08=function(){
			function customSplit(strvalue,separator,arrayName){
				var arrayValue,n=0,startPosition=0,endPosition=0,restOfString=strvalue;
				if(0!=separator.length)for(;
					restOfString.indexOf(separator)!=-1&&(endPosition=restOfString.indexOf(separator),arrayValue=restOfString.substring(startPosition,endPosition),arrayName.push(arrayValue),n++,restOfString=restOfString.substring(endPosition+1,restOfString.length()),1e3!=n);
				);
				return arrayName.push(restOfString),n++,n
			}
			logDebug("updateFeeQuantity_BLD08() started.");
			try{
				var $iTrc=bs.utils.debug.ifTracer,feeQuantity=(bs.utils,appTypeArray[0].toUpperCase(),appTypeArray[1].toUpperCase(),0),feeItem="",customField="",feeItemsArr=new Array,feeItemsQuantityArr=new Array,lookupTable="DBQ Fee Quantity Transfer",tmpFeeListString="",tmpFeeListSplittedItemsCount=0,tmpFeeQuantityString="",tmpFeeQuantitySplittedItemsCount=0;
				if(0!=NumberOfFeeItems){
					tmpFeeListString=FeeItemsList.substring(1,FeeItemsList.length()-1),tmpFeeListSplittedItemsCount=customSplit(tmpFeeListString,"|",feeItemsArr),logDebug("Splitted "+tmpFeeListSplittedItemsCount+" FeeItemsList into array: "+feeItemsArr),tmpFeeQuantityString=FeeItemsQuantityList.substring(1,FeeItemsQuantityList.length()-1),tmpFeeQuantitySplittedItemsCount=customSplit(tmpFeeQuantityString,"|",feeItemsQuantityArr),logDebug("Splitted "+tmpFeeQuantitySplittedItemsCount+" FeeItemsQuantityList into array: "+feeItemsQuantityArr);
					for(var fee in feeItemsArr)feeItem=feeItemsArr[fee],feeQuantity=feeItemsQuantityArr[fee],customField=lookup(lookupTable,feeItem),$iTrc(void 0!=customField,feeItem+" was found in lookupTable "+lookupTable)&&(logDebug("Updating field "+customField+" with fee quantity "+feeQuantity),editAppSpecific(customField,feeQuantity))
				}
			}
			catch(err){
				showMessage=!0,comment("Error on custom function updateFeeQuantity_BLD08(). Please contact administrator. Err: "+err)
			}
		}
	}).call(emse);
	var utils=root.utils={};
	(function(){
		var root=this,accela=root.accela={};
		(function(){
			var root=this,updateExpirationDateAndStatus=root.updateExpirationDateAndStatus=function(capId,date,status){
				var vParentCapID=getParentLicenseCapID(capId);
				if(vParentCapID){
					b1Lic=aa.expiration.getLicensesByCapID(vParentCapID).getOutput(),b1Exp=b1Lic.getB1Expiration(),logDebug("Current License Status: "+b1Exp.getExpStatus()),date&&bs.utils.date.isDate(date.toString())&&(b1Exp.expDate=date),status&&status.length>0&&b1Exp.setExpStatus(status),aa.expiration.editB1Expiration(b1Exp),bs.utils.debug.assert(!0,"Expiration Status = "+b1Exp.expStatus+" ----- Date = "+b1Exp.expDateString),updateTask("License Status","Active","Updated via renewal script updateExpirationDateAndStatus","","",vParentCapID);
					var result=aa.cap.getProjectByMasterID(vParentCapID,"Renewal",null);
					if(result.getSuccess()){
						projectScriptModels=result.getOutput(),null!=projectScriptModels&&0!=projectScriptModels.length||logDebug("ERROR: Failed to get renewal CAP by parent CAPID("+vParentCapID+")"),logDebug(projectScriptModels.length);
						for(i in projectScriptModels)projectScriptModels[i].setStatus("Complete"),aa.cap.updateProject(projectScriptModels[i])
					}
					else logDebug("ERROR: Failed to get renewal CAP by parent CAP("+vParentCapID+") : "+result.getErrorMessage())
				}
				else logDebug("WARNING: Unable to find parent license")
			},
			loadAccelaGlobals=root.loadAccelaGlobals=function(capId){
				function getScriptText(vScriptName){vScriptName=vScriptName.toUpperCase();
				var emseBiz=aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput(),emseScript=emseBiz.getMasterScript(aa.getServiceProviderCode(),vScriptName);
				return emseScript.getScriptText()+""}var capIdArr=String(capId).split("-");
				with(aa.env.setValue("PermitId1",capIdArr[0]),aa.env.setValue("PermitId2",capIdArr[1]),aa.env.setValue("PermitId3",capIdArr[2]),scriptRoot)eval(getScriptText("INCLUDES_ACCELA_GLOBALS"))
			},
			writeReportToFile=root.writeReportToFile=function(reportName,options){
				var settings={capID:"",module:"",parameters:{}};
				for(var attr in options)settings[attr]=options[attr];
				var rpt,rptModel,rptResult,rptFile,filename,idx,params,repResultScriptModel;
				rptModel=aa.reportManager.getReportInfoModelByName(reportName),rpt=rptModel.getOutput(),""!=settings.capID&&rpt.setCapId(settings.capID.toString()),""!=settings.module&&rpt.setModule(settings.module),idx=0;
				for(var param in settings.parameters)0==idx&&(params=aa.util.newHashMap()),params.put(param,settings.parameters[param]),logDebug("report param: "+settings.parameters[param].key+"-"+settings.parameters[param].toString()),idx+=1;
				return idx>0&&rpt.setReportParameters(params),rptResult=aa.reportManager.getReportResult(rpt),rptResult.getSuccess()?(repResultScriptModel=rptResult.getOutput(),repResultScriptModel.getName().toString().indexOf(".xls")<0&&repResultScriptModel.getFormat().toString().indexOf("xls")>=0&&repResultScriptModel.setName(repResultScriptModel.getName()+".xls"),logDebug(repResultScriptModel.getName()),rptFile=aa.reportManager.storeReportToDisk(repResultScriptModel),filename=rptFile.getOutput()):(logDebug("ERROR WRITING REPORT TO FILE: "),null)
			},
			popupReport=root.popupReport=function(reportName,options){
				var settings={parameters:{}};
				for(var attr in options)settings[attr]=options[attr];
				var rptModel,params,rptMsg,permit;
				if(rptModel=aa.reportManager.getReportModelByName(reportName),rptModel=rptModel.getOutput(),permit=aa.reportManager.hasPermission(reportName,currentUserID),!permit.getOutput().booleanValue())
					return void logDebug("utils.popupReport(): Unable to run report - "+currentUserID+" does not have permission to run report "+reportName);
				params=aa.util.newHashMap();for(var param in settings.parameters)params.put(param,settings.parameters[param]);
				rptMsg=aa.reportManager.runReport(params,rptModel),showMessage=!0,showDebug=!1,message=rptMsg.getOutput()
			},
			emailContacts=root.emailContacts=function(contactType,optionsEmail){
				var settings={from:bs.constants.defaultEmailSender,subj:"",body:"",files:[]};
				arguments.length>2&&(capId=arguments[2]);
				for(var attr in optionsEmail)settings[attr]=optionsEmail[attr];
				var emailAddr,emailResult,capContactResult=aa.people.getCapContactByCapID(capId);
				if(capContactResult.getSuccess()){
					var Contacts=capContactResult.getOutput();
					for(yy in Contacts)(contactType.equals(Contacts[yy].getCapContactModel().getPeople().getContactType())||0==contactType.length)&&(emailAddr=Contacts[yy].getEmail(),null!=emailAddr&&(0===settings.files.length?emailResult=aa.sendMail(settings.from,bs.constants.emailEmailRedirectTo.length>0?bs.constants.emailEmailRedirectTo:emailAddr,"",settings.subj,bs.constants.emailEmailRedirectTo.length>0?emailAddr+"<br /><br />"+settings.body:settings.body):(logDebug("utils.emailContacts(): Sending email with attachments."),emailResult=aa.sendEmailWithAttachedFiles(settings.from,emailAddr,null,settings.subj,bs.constants.emailEmailRedirectTo.length>0?emailAddr+"<br /><br />"+settings.body:settings.body,settings.files)),logDebug(emailResult.getSuccess()?"Email sent to "+emailAddr+".":"System failed send report to "+emailAddr+" because mail server is broken or report file size is great than 5M.")))
				}
			},
			emailPerson=root.emailPerson=function(optionsEmail){
				var settings={from:bs.constants.defaultEmailSender,to:"",subj:"",body:"",files:[]};
				for(var attr in optionsEmail)settings[attr]=optionsEmail[attr];
				var emailResult;
				0===settings.files.length?emailResult=aa.sendMail(settings.from,bs.constants.emailEmailRedirectTo.length>0?bs.constants.emailEmailRedirectTo:settings.to,"",settings.subj,bs.constants.emailEmailRedirectTo.length>0?settings.to+"<br /><br />"+settings.body:settings.body):(logDebug("utils.emailContacts(): Sending email with attachments."),emailResult=aa.sendEmailWithAttachedFiles(settings.from,bs.constants.emailEmailRedirectTo.length>0?bs.constants.emailEmailRedirectTo:settings.to,null,settings.subj,bs.constants.emailEmailRedirectTo.length>0?settings.to+"<br /><br />"+settings.body:settings.body,settings.files)),

				logDebug(emailResult.getSuccess()?"Email sent to "+settings.to+".":"System failed send report to "+settings.to+" because mail server is broken or report file size is great than 5M.")
			},
			emailPeople=root.emailPeople=function(optionsEmail){
				var settings={from:bs.constants.defaultEmailSender,to:[],subj:"",body:"",files:[]},
				personSettings={};
				for(var attr in optionsEmail)settings[attr]=optionsEmail[attr];
				for(var attr in settings)personSettings[attr]=settings[attr];
				for(var person in optionsEmail.to)personSettings.to=optionsEmail.to,emailPerson(personSettings)
			},
			emailLicensedPros=root.emailLicensedPros=function(capID,optionsEmail){
				var settings={from:bs.constants.defaultEmailSender,subj:"",body:"",files:[]};
				for(var attr in optionsEmail)settings[attr]=optionsEmail[attr];
				var arrPros,idxPro,emailAddr,emailResult;
				if(arrPros=getLicenseProfessional(capID),arrPros&&arrPros.length>0)for(idxPro in arrPros)emailAddr=arrPros[idxPro].getEmail(),null!=emailAddr&&(0===settings.files.length?emailResult=aa.sendMail(settings.from,bs.constants.emailEmailRedirectTo.length>0?bs.constants.emailEmailRedirectTo:emailAddr,"",settings.subj,bs.constants.emailEmailRedirectTo.length>0?emailAddr+"<br /><br />"+settings.body:settings.body):(logDebug("utils.emailLicensedPros():  sending email with attachments."),emailResult=aa.sendEmailWithAttachedFiles(settings.from,bs.constants.emailEmailRedirectTo.length>0?bs.constants.emailEmailRedirectTo:emailAddr,null,settings.subj,settings.body,settings.files)),logDebug(emailResult.getSuccess()?"A copy of this report has been sent to "+emailAddr+".":"System failed send report to "+emailAddr+" because mail server is broken or report file size is great than 5M."))
			},
			displayEnvVariables=root.displayEnvVariables=function(){
				for(var params=aa.env.getParamValues(),keys=params.keys(),key=null;keys.hasMoreElements();)
					key=keys.nextElement(),logDebug(key+" = "+aa.env.getValue(key))
			},
			getTaskItemsCount=root.getTaskItemsCount=function(capId,wfTask,arrTaskStatuses){
				var idx,len=0;
				for(idx in arrTaskStatuses)try{len+=aa.workflow.getTaskItems(capId,wfTask,"",null,arrTaskStatuses[idx],null).getOutput().length}catch(ex){}return len
			},
			getStatusHistoryCount=root.getStatusHistoryCount=function(capId,wfTask,wfTaskStatus){
				for(var len=0,wfObj=aa.workflow.getHistory(capId).getOutput(),x=0;x<wfObj.length;x++)
					wfObj[x].disposition==wfTaskStatus&&wfObj[x].getTaskDescription()==wfTask&&(len+=1);
				return len
			},
			getDocumentList=root.getDocumentList=function(capId,userID,group,category){
				var idx,docList=[],docFilteredList=[];
				if(docListResult=aa.document.getCapDocumentList(capId,userID),docListResult.getSuccess()&&(docList=docListResult.getOutput()),!group&&!category)
					return docList;
				for(idx in docList){
					bs.utils.debug.printObjProps(docList[idx]),bs.utils.debug.printObjProps(docList[idx].documentEntityAssociationModel),bs.utils.debug.printObjProps(docList[idx].GGuideSheetItemModel),bs.utils.debug.printObjProps(docList[idx].relationModel);
					try{docList[idx].docGroup!=group&&group||docList[idx].docCategory!=category&&category||docFilteredList.push(docList[idx])}catch(ex){}
				}
				return docFilteredList
			},
			getStdChoiceVals=root.getStdChoiceVals=function(strControlName,options){
				var bizDomScriptArray,arrChoices=[],bizDomScriptResult=aa.bizDomain.getBizDomain(strControlName),settings={rtnVal:!0,rtnDesc:!1};
				for(var attr in options)settings[attr]=options[attr];
				if(bizDomScriptResult.getSuccess()){
					bizDomScriptArray=bizDomScriptResult.getOutput().toArray();
					for(var i in bizDomScriptArray)settings.rtnVal&&!settings.rtnDesc?arrChoices.push(bizDomScriptArray[i].getBizdomainValue().toString()):!settings.rtnVal&&settings.rtnDesc?arrChoices.push(bizDomScriptArray[i].getDescription().toString()):arrChoices.push({val:bizDomScriptArray[i].getBizdomainValue().toString(),desc:bizDomScriptArray[i].getDescription().toString()})
				}
				return arrChoices
			},
			getFeesByCapAndSchedule=root.getFeesByCapAndSchedule=function(capId,fSched){
				var idxFees,arrFees=[],bal=0;
				arrFees=aa.finance.getFeeItemList(capId,fSched,null,null,null).getOutput();
				for(idxFees in arrFees)bal+=utils.accela.overrides.feeBalance(arrFees[idxFees].getFeeCod());
				return bal
			},
			feeAmt=root.feeAmt=function(feestr,feeSch,invoicedOnly){
				var ff,amtFee=0;
				invoicedOnly=void 0!=invoicedOnly&&invoicedOnly;
				var feeResult=aa.fee.getFeeItems(capId,feestr,null);
				if(!feeResult.getSuccess())
					return logDebug("**ERROR: getting fee items: "+capContResult.getErrorMessage()),999999;
					var feeObjArr=feeResult.getOutput();
					for(ff in feeObjArr)feestr&&!feestr.equals(feeObjArr[ff].getFeeCod())||feeSch&&!feeSch.equals(feeObjArr[ff].getF4FeeItemModel().getFeeSchudle())||(matches(feeObjArr[ff].feeitemStatus,"VOIDED","CREDITED")?logDebug("feestr="+feestr+" ---- Voided/Credited"):invoicedOnly&&"INVOICED"!=feeObjArr[ff].feeitemStatus?logDebug("feestr="+feestr+" ---- NOT  Invoiced"):amtFee+=feeObjArr[ff].getFee());
				return amtFee
			},
			parseDocumentModelArray=root.parseDocumentModelArray=function(documentModelArray){
				function convertScratchToObject(){var i;i=scratch.indexOf("documentNo=11");var documentNo=scratch.substring(i,scratch.indexOf(",",i));return{documentNo:documentNo}}
				var scratch,idxStart=0,idxEnd=0,docs=[];
				for(idxStart=documentModelArray.indexOf("documentNo=",idxStart),idxEnd=documentModelArray.indexOf(",,",idxStart<0?0:idxStart);
					idxStart>-1&&idxEnd>-1;)
				scratch=idxEnd==-1?documentModelArray.substring(idxStart):documentModelArray.substring(idxStart,idxEnd),docs.push(convertScratchToObject()),idxStart=documentModelArray.indexOf("documentNo=",idxStart+1),idxEnd=documentModelArray.indexOf("documentNo=",idxStart<0?0:idxStart)
			},
			matchARecordType=root.matchARecordType=function(appTypeStringArray,valTypeString){
				var appTypeArray,idx,key,valTypeArray=valTypeString.split("/");
				if(4!=valTypeArray.length)
					return!1;
				for(idx in appTypeStringArray){
					if(appTypeArray=appTypeStringArray[idx].split("/"),4!=appTypeArray.length)
						break;
					for(key in appTypeArray){
						if(appTypeArray[key].toUpperCase()!=valTypeArray[key].toUpperCase()&&"*"!=appTypeArray[key])break;if(key==appTypeArray.length-1)
							return!0
						}
				}
				return!1
			},
			overrides=root.overrides={};
			// Fee Balance
			(function(){
				var root=this;
				root.feeBalance=function(feestr,feeSch,invoicedOnly){
					var ff,amtFee=0,amtPaid=0;
					invoicedOnly=void 0!=invoicedOnly&&invoicedOnly;
					var feeResult=aa.fee.getFeeItems(capId,feestr,null);
					if(!feeResult.getSuccess())
						return logDebug("**ERROR: getting fee items: "+capContResult.getErrorMessage()),999999;
					var feeObjArr=feeResult.getOutput();
					for(ff in feeObjArr)
						if((!feestr||feestr.equals(feeObjArr[ff].getFeeCod()))&&(!feeSch||feeSch.equals(feeObjArr[ff].getF4FeeItemModel().getFeeSchudle())))
						if(matches(feeObjArr[ff].feeitemStatus,"VOIDED","CREDITED"))
							logDebug("feestr="+feestr+" ---- Voided/Credited");
							else if(invoicedOnly&&"INVOICED"!=feeObjArr[ff].feeitemStatus)
								logDebug("feestr="+feestr+" ---- NOT  Invoiced");
								else{
									amtFee+=feeObjArr[ff].getFee();
									var pfResult=aa.finance.getPaymentFeeItems(capId,null);
									if(pfResult.getSuccess()){
										var pfObj=pfResult.getOutput();
										for(ij in pfObj)feeObjArr[ff].getFeeSeqNbr()==pfObj[ij].getFeeSeqNbr()&&(amtPaid+=pfObj[ij].getFeeAllocation());
										logDebug("feestr="+feestr+" - status="+feeObjArr[ff].feeitemStatus+" - amtFee="+amtFee+" - amtPaid="+amtPaid)
									}
								}
							return amtFee-amtPaid
				}
			}).call(overrides);
			var inspection=root.inspection={};
			// inspections functions
			(function(){
				var root=this;
				root.getInspections=function(capId){
					return aa.inspection.getInspections(capId).getOutput()
				},
				root.getInspection=function(capId,inspectionId){
					return aa.inspection.getInspection(capId,inspectionId).getOutput()
				}
			}).call(inspection);
			var people=root.people={};
			// get people functions
			(function(){
				var root=this;
				root.getOwners=function(capId){
					return aa.owner.getOwnerByCapId(capId).getOutput()
				},
				root.getContacts=function(capId){
					return aa.people.getCapContactByCapID(capId).getOutput()
				},
				root.getLicensedPros=function(capId){
					return aa.licenseProfessional.getLicenseProf(capId).getOutput()
				}
			}).call(people)
		}).call(accela);
		var date=root.date={};
		// date functions
		(function(){
			var root=this;
			root.isDate=function(sDate){var dte=new Date(sDate);return"NaN"!=dte.toString()&&"Invalid Date"!=dte.toString()},
			root.dateDiff=function(date1,date2){var timeDiff=date1.getTime()-date2.getTime();return timeDiff/864e5},
			root.monthsDiff=function(date1,date2){var months;return months=12*(date2.getFullYear()-date1.getFullYear()),months-=date1.getMonth()+1,months+=date2.getMonth(),months<=0?0:months},
			root.dateAdd=function(interval,number,date){
				var rtnDate=new Date(date.toString());
				switch(interval){
					case"d":rtnDate.setDate(rtnDate.getDate()+number);
					break;
					case"m":rtnDate.setMonth(rtnDate.getMonth()+number);
					break;
					case"y":rtnDate.setYear(rtnDate.getFullYear()+number);
					break;
					case"h":rtnDate.setHours(rtnDate.getHours()+number);
					break;
					case"n":rtnDate.setMinutes(rtnDate.getMinutes()+number);
					break;
					case"s":rtnDate.setSeconds(rtnDate.getSeconds()+number)
				}
				return rtnDate
			},
			root.weekdayAdd=function(number,date){for(var rtnDate=new Date(date.toString()),i=0;i<number;)rtnDate.setDate(rtnDate.getDate()+1),rtnDate.getDay()>0&&rtnDate.getDay()<6&&i++;return rtnDate},
			root.formatToAcellaDateStr=function(date){
				var yyyy=date.getFullYear().toString(),mm=(date.getMonth()+1).toString(),dd=date.getDate().toString(),mmChars=mm.split(""),ddChars=dd.split("");
				return datestring=yyyy+"-"+(mmChars[1]?mm:"0"+mmChars[0])+"-"+(ddChars[1]?dd:"0"+ddChars[0])
			},
			root.formatToMMDDYYYY=function(date){
				var yyyy=date.getFullYear().toString(),mm=(date.getMonth()+1).toString(),dd=date.getDate().toString(),mmChars=mm.split(""),ddChars=dd.split("");
				return datestring=(mmChars[1]?mm:"0"+mmChars[0])+"/"+(ddChars[1]?dd:"0"+ddChars[0])+"/"+yyyy
			},
			root.formatToMMDDYYYYHHMMSS=function(date){
				var yyyy=date.getFullYear().toString(),mm=(date.getMonth()+1).toString(),dd=date.getDate().toString(),hh=date.getHours().toString(),mi=date.getMinutes().toString(),ss=date.getSeconds().toString(),mmChars=mm.split(""),ddChars=dd.split(""),hhChars=hh.split(""),miChars=mi.split(""),ssChars=ss.split("");
				return datestring=(mmChars[1]?mm:"0"+mmChars[0])+"/"+(ddChars[1]?dd:"0"+ddChars[0])+"/"+yyyy+" "+(hhChars[1]?hh:"0"+hhChars[0])+":"+(miChars[1]?mi:"0"+miChars[0])+":"+(ssChars[1]?ss:"0"+ssChars[0])
			},
			root.convertAccelaDateObjToJavascriptDate=function(jDte){
				timelessDtArr=jDte.toString().split(" ")[0].split("-");
				var yyyy=timelessDtArr[0].toString(),mm=timelessDtArr[1].toString(),dd=timelessDtArr[2].toString(),dte=new Date(mm+"/"+dd+"/"+yyyy);return dte
			}
		}).call(date);
		var debug=root.debug={};
		// debugging
		(function(){
			var root=this,printObjProps=(root.assert=function(cond,msg){return cond&&logDebug(msg),cond},
				root.ifTracer=function(cond,msg){return cond=!!cond,logDebug(cond.toString().toUpperCase()+": "+msg),cond},
				root.printObjProps=function(obj){
					var idx;
					null!=obj&&null!=obj.getClass&&logDebug("************* "+obj.getClass()+" *************");
					for(idx in obj)
						if("function"==typeof obj[idx])
							try{logDebug(idx+":  "+obj[idx]())}
						catch(ex){}
						else logDebug(idx+":  "+obj[idx]);
					logDebug("***********************************************")
				}
			);
			root.printClassDiagram=function(capId){
				bs.utils;
				aa.print("----------------> getInspection)");
				var inspection=aa.inspection.getInspection(capId,8307547).getOutput();
				aa.print("Inspection: "+inspection),printObjProps(inspection),null!=inspection?printObjProps(inspection.inspectionDate):logDebug("WARNING: There is no inspection")
			}
		}).call(debug)
	}).call(utils)
}).call(bs);
