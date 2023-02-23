$( document ).ready(function() {
//if monitored cpu is high
chrome.runtime.onMessage.addListener(function(request){
  //display button to add to blacklist
  if(request.message==='high'){
    addBlacklist();
  }
});

//get cpu usage per tab whenever the cpu is updated
//==>only display when popup.html is opended
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
         }
     });
   });
   //display in a chart
   perCirc($('#setPerc'),cpu);
 });
 //send to backgroundpage to add blacklist
function addBlacklist(){
document.getElementById('addBlacklist').style.display='';
document.getElementById('msg').innerText='The cpu usage is abnormal.';
$('#addBlacklist').on('click',function(){
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if(!tabs) {
          return;
      }
      var ctab = tabs[0];
      chrome.runtime.sendMessage({action: 'addBlacklist', tab : ctab});
      chrome.tabs.remove(ctab.id);
});
chrome.browserAction.setBadgeText({
    text: '',
});
});

}

//check when blocker is activated
$('#yes').on('click',function(){
  chrome.runtime.sendMessage({action: 'ignore'});
});
$('#no').on('click',function(){
  chrome.runtime.sendMessage({action:'close'});
});
$('#remove').on('click',function(){
  chrome.runtime.sendMessage({action:'remove'});
});
//display cpu percentage in a animated chart
	function perCirc($el, end, i) {
		if (end < 0)
			end = 0;
		else if (end > 100)
		end = 100;
		if (typeof i === 'undefined')
			i = 0;
		var curr = (100 * i) / 360;
		$el.find(".showPerc").html(Math.round(curr) + "%");
		if (i <= 180) {
			$el.css('background-image', 'linear-gradient(' + (90 + i) + 'deg, transparent 50%, white 50%),linear-gradient(90deg, white 50%, transparent 50%)');
		} else {
			$el.css('background-image', 'linear-gradient(' + (i - 90) + 'deg, transparent 50%, #660033 50%),linear-gradient(90deg, white 50%, transparent 50%)');
		}
		if (curr < end) {
			setTimeout(function () {
					perCirc($el, end, ++i);
		}, 1);
		}
	}

});
