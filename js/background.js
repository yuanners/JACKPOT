//when a new tab is loaded, check for blacklist
var win;
chrome.tabs.onUpdated.addListener(function (tabId , info) {
  //loaded finish
  if (info.status === 'complete') {
    //reseting status
    chrome.runtime.sendMessage({message:''});
    chrome.storage.sync.set({"status":false});
    chrome.storage.sync.get({"blacklist":[]},function(data){
      console.log(data.blacklist);
    })
  //get the blacklist from txt file
 fetch('/lists/blacklist.txt')
 .then(response => response.text())
 .then(text => checking(text))
//check the current tab url
 function checking(text){
	 chrome.tabs.getSelected(null, function(tab){
		 var url=tab.url;
     //shorten the url(for ease of comparing)
		 var taburl = url.match(/:\/\/(.[^/]+)/);
		 taburl=taburl[0];
		 var blacklistedUrls = text.split('\n');
		 var match;

     //get the latest updated blacklist
     chrome.storage.sync.get({"blacklist":[]},function(data){
       if(data.blacklist.length==0){
         chrome.storage.sync.set({"blacklist":blacklistedUrls});
         for(var i=0;i<blacklistedUrls.length;i++){
          if(blacklistedUrls[i].includes(taburl)){
            match = blacklistedUrls[i];
            break;
           }
         }
       }else{
         var bl=data.blacklist;
         for(var i=0;i<bl.length;i++){
           if(bl[i].includes(taburl)){
             match = bl[i];
             break;
           }
         }
       }
     //if found
			 if(match){
          win=window.open('/html/blocker.html');
          checkAction(tab.id,match);
          }else{
				 chrome.browserAction.setBadgeText({
						 text: 'Safe',
				 });
         chrome.browserAction.setBadgeBackgroundColor({
						 color: [0, 128, 0, 100],
				 });
         //if not found in blacklist, record cpu usage and monitor for spikes after 10 mins
         cpuMonitor();
         chrome.alarms.create("Start", {periodInMinutes:1});
         chrome.alarms.onAlarm.addListener(function(alarm){
            cpucheck();
          });
			 }
     });
     });
   }
 }
});
//get cpu usage per tab whenever the cpu is updated
//==>without opening the popup page(different from popup.js)
function cpuMonitor(){
var id;
var process;
var cpu;
var cpul=[];
chrome.processes.onUpdatedWithMemory.addListener(
  function (processes) {
 chrome.tabs.getSelected(null, function(tab){
     id=tab.id;
     chrome.processes.getProcessIdForTab(id,function(proid){
       process=proid;
         if(process in processes){
           cpu=processes[process].cpu;
           cpul.push(parseInt(cpu));
           //save all the cpu in an arraylist
           chrome.storage.sync.set({ "data" : cpul });
           //send message to popup if is high
           chrome.storage.sync.get("status",function(check){
             if(check.status==true){
             chrome.runtime.sendMessage({message:'high'});
           }
         });
         }

     });
   });
 });
}

//check for consistent high cpu
function cpucheck(){
  //get the saved cpu
  chrome.storage.sync.get("data",function(cpu){
    var cpul=cpu.data;
    var count=0;
    //only get the latest 60
      for(var i=cpul.length-20;i<cpul.length;i++){
        if(cpul[i]>=0)
        count=count+1;
      }
    if(count>3){
      chrome.browserAction.setBadgeBackgroundColor({
          color: [200, 0, 0, 100],
      });

      chrome.browserAction.setBadgeText({
          text: 'CPU',
      });
      //high cpu usage observed
      chrome.storage.sync.set({"status":true});
    }else{
      chrome.storage.sync.set({"status":false});
      chrome.browserAction.setBadgeText({
          text: '',
      });

    }

    });
}
//when message is sent from popup.js
function checkAction(ctab,match){
chrome.runtime.onMessage.addListener(function(message){
  //close tab
  if(message.action==='close'){
    chrome.tabs.remove(ctab);
    win.close();
  }else if(message.action==='ignore'){
    //close the popup and do nothing
    win.close();
  }else if(message.action==='remove'){
    chrome.storage.sync.get({"blacklist":[]},function(data){
      var bl=data.blacklist;
      var i = bl.indexOf(match);
      if (i > -1) {
        bl.splice(i, 1);
      }
      chrome.storage.sync.set({"blacklist":bl})
    });
    win.close();
  }else if(message.action ==='addBlacklist'){
    chrome.storage.sync.get({"blacklist":[]},function(data){
      var blacklist=data.blacklist;
      var url=message.tab.url;
      var curl = url.match(/:\/\/(.[^/]+)/);
      curl=curl[0];
      blacklist.push(curl);
      chrome.storage.sync.set({"blacklist":blacklist})
    });
  }

  });

  }
