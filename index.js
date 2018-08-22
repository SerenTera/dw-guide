//Demon Wheel Guide - the super fucky mashed up together module.
//NON PRIVATE MODULE: DO SHARE WITH ANYONE

/*
 >>> Config.json Help
	enabled : Default enable/disable of module (true to enable)
	notifier : Default enable/disable of system popup notices (true to enable)
	messager : Default enable/disable of chat warning messages (true to enable)
	textcolor : Default text color(Default hot pink). Use 'bccolor <hexcode>' to check or use online tools to find hex codes for your preferred colors. Eg:http://www.color-hex.com/
	textcolorred : Color for ODD numbers
	textcolorblue : Color for EVEN numbers
	notifier_type : Dictate the type of notification. 42 is a blue glowy thing that catches attention. 2 is a normal popup thing.
	MESSAGE_ODD_OR_EVEN : Change to notifying changes to odd/even only, not numbers. Very accurate but will send twice if it stays the same.
*/


///////Data of ids	
const dwZone=9066, 		//Zone ID of Demon's wheel
	  dwHuntingZone=466,//Hunting zone id of dw
	  dwBId=46601,		 //Template id of baldersnatch
	  dwDId=46602,  	//Template id of Demoros
	  
	  
//////Skill Data  
	dwBAoeId ={ //Aoe ID of demoros, with aoe numbers
		1306:1, //>50% Hp
		1307:2,
		1308:3,
		1309:4,
		1310:5,
		1319:1, //<50% Hp
		1320:2,
		1321:3,
		1322:4,
		1323:5
	},
		
	skills ={
		1: { //Baldersnatch
			1312: 'IN IN IN GO IN U SLOWPOKE', //Donut
			1314: 'IN IN IN GO IN U SLOWPOKE',
			1316: 'IN IN IN GO IN U SLOWPOKE',
			1318: 'IN IN IN GO IN U SLOWPOKE',
			1311: 'OUT OUT OUT GTFO',			//Circle
			1313: 'OUT OUT OUT GTFO',
			1315: 'OUT OUT OUT GTFO',
			1317: 'OUT OUT OUT GTFO'
		},
		
		2: { //Demoros
			1311: 'IN IN IN then OUT',
			1314: 'IN IN IN then OUT',
			1312: 'OUT OUT OUT then IN',
			1313: 'OUT OUT OUT then IN',
			1113: 'LASERRRRR~ Iframe',
			2113: 'LASERRRRR~ Iframe',
			1223: 'Double Puddle!'
		}
	},
	
	abnormies ={
		46600114: 'Prepare to go IN IN IN',
		46600115: 'Prepare to go OUT OUT OUT',
		46600116: 'Prepare to go IN IN IN',
		46600117: 'Prepare to go OUT OUT OUT'
	},

	balloonMsg ={
		466050:'Dice: WHITE or BLUE',
		466051:'Dice: RED or BLUE',
		466052:'Dice: WHITE or RED',
		466054:'Dice: RED only',
		466055:'Dice: WHITE only',
		466056:'Dice: BLUE only'
	}
		
			
		
			
const path = require('path'),
	  fs = require('fs')



module.exports = function bossnotify(mod) {
	
	let bossid=0,
		hooks = [],
		dwcount=0,
		IN_DUNGEON=false,		//Check whether player in dungeon. Set true to always enable and always check for boss id (recommended false)
		isEven=true,
		isBaldersnatch=false,
		bossIndex=0,
		currentBall = 0,
		enabled,
		notifier,
		messager,
		textcolor,
		textcolorred,
		textcolorblue,
		notifier_type,
		toParty,
		MESSAGE_ODD_OR_EVEN
		
	loadSettings()
////////Commands:		
	mod.command.add('dw', {
		$none() {
			enabled=!enabled
			mod.command.message(enabled ? '(DW Guide) Enabled' : '(DW Guide) Disabled')
		},
		
		$default() {
			mod.command.message('Wrong command. Use dw OR dw [boss|message|notify|party]')
		},
		
		boss() {
			isBaldersnatch=!isBaldersnatch
			mod.command.message(isBaldersnatch ? '(DW Guide) Enabled Baldersnatch' : '(DW Guide) Enabled Demoros')
		},
		
		message() {
			messager=!messager
			mod.command.message(messager ? '(DW Guide) Messager Enabled' : '(DW Guide) Messager Disabled')
		},
	
		notify() {
			notifier=!notifier
			mod.command.message(notifier ? '(DW Guide) Notifier Enabled' : '(DW Guide) Notifier Disabled')
		},
	
		party() {
			toParty = !toParty
			mod.command.message(toParty ? '(DW Guide) Party number sending Enabled' : '(DW Guide) Party number sending Disabled')
		}
	})
	
	
	
/////Dispatches	
	mod.hook('S_LOAD_TOPO', 3, event => {
		if(event.zone===9066) {
			IN_DUNGEON=true
			if(hooks.length === 0) initHooks(); //Incase same topo and already hooks
			mod.command.message('(DW Guide) Entered Demon Wheel')
		}
		else {
			unload()
			dwcount=0
			bossIndex = 0
			IN_DUNGEON=false
		}
	})		
	
	function initHooks() {	
	hook('S_BOSS_GAGE_INFO', 3, event => {
		if(enabled && IN_DUNGEON) {
			if(event.id.equals(bossid)) return
		
			if(event.huntingZoneId == dwHuntingZone && event.templateId == dwBId) {
				bossid = event.id
				isBaldersnatch = true
				dwcount = 0
				bossIndex = 1
				mod.command.message('(DW Guide) Identified Baldersnatch')
			}
			
			else if(event.huntingZoneId == dwHuntingZone && event.templateId == dwDId) {
				bossid = event.id
				isBaldersnatch = false
				bossIndex = 2
				mod.command.message('(DW Guide) Identified Demoros')
			}
		}
	})
	
	hook('S_ACTION_STAGE', mod.majorPatchVersion >= 74 ? 7 : 6 , event => {
		if(enabled && IN_DUNGEON) {
			if(!event.gameId.equals(bossid) || event.stage!==0 || event.skill.huntingZoneId !== dwHuntingZone) return
			
			if(isBaldersnatch && dwBAoeId[event.skill.id]) { //Baldersnatch
				dwcount += dwBAoeId[event.skill.id]
				if(!MESSAGE_ODD_OR_EVEN) oddeven(dwcount);
				return
			}				
			
			if(skills[bossIndex][event.skill.id]) sendGeneral(skills[bossIndex][event.skill.id])
				
			else if(!isBaldersnatch && event.skill.id === 1303) sendGeneral(balloonMsg[currentBall])
		}
	})
	
	hook('S_QUEST_BALLOON', 1, event => {
		if(enabled && IN_DUNGEON && !isBaldersnatch) { 
			let balloonId = parseInt(event.message.replace(/\D/g,''),10)
			if(balloonMsg[balloonId]) {
				sendGeneral(balloonMsg[balloonId])
				currentBall = balloonId
			}
		}
	})
	
	hook('S_ABNORMALITY_BEGIN', 2, event => {
		if(enabled && IN_DUNGEON && isBaldersnatch) {
			if(abnormies[event.id]) {
				sendGeneral(abnormies[event.id])
				return
			}
			
			if(MESSAGE_ODD_OR_EVEN) {
				switch(event.id) {
					case 46600105:  //odd case
						isEven=false
						message('ODD', textcolorred)
						if(notifier) notice('ODD', textcolorred)
						break
				
					case 46600106:  //even case
						isEven=true
						message('EVEN', textcolorblue)
						if(notifier) notice('EVEN', textcolorblue)
						break
					
					case 46600110: //Send regardless to inform even if theres no changes
						message((isEven ? 'EVEN' : 'ODD'), (isEven ? textcolorblue:textcolorred))
						if(notifier) notice((isEven ? 'EVEN' : 'ODD'), (isEven ? textcolorblue:textcolorred))

				}		
			}
		}
	})
	
	}
	
/////Functions
	function sendGeneral(msg) {
		if(messager) message(msg)
		if(notifier) notice(msg)
	}
	
	function oddeven(num) {
		if(num % 2 == 0) { //is Even
			if(messager) message(`Count:${num} (even)`,textcolorblue)
			if(notifier) notice(num,textcolorblue)
			if(toParty)	messageParty(num)
		}
		
		else {
			if(messager) message(`Count:${num} (odd)`,textcolorred)
			if(notifier) notice(num,textcolorred)
			if(toParty)	messageParty(num)
		}
	}
	
	function notice(msg,textColor) {
		if(textColor === undefined) textColor = textcolor
		mod.send('S_DUNGEON_EVENT_MESSAGE', 1, {
			unk1: notifier_type,
			message: `</FONT><FONT COLOR="${textColor}">${msg}`
		})	
	}
	
	function message(msg,textColor) {
		if(textColor === undefined) textColor = textcolor
		
		mod.send('S_CHAT', 1, {
			channel: 24,
			message:`</FONT><FONT COLOR="${textColor}">${msg}`
		})
	}
	
	function messageParty(msg) {
		mod.send('C_CHAT', 1, {
			channel: 21, 
			message: msg
		})
	}
	
	function unload() {
		if(hooks.length) {
			for(let h of hooks) mod.unhook(h)

			hooks = []
		}
	}

	function hook() {
		hooks.push(mod.hook(...arguments))
	}
	
	function loadSettings() {
		fs.readFile(path.join(__dirname,'config.json'), (err,data) => {
			if(err) console.log(err);
			else
				({enabled,notifier,messager,textcolor,textcolorred,textcolorblue,notifier_type,MESSAGE_ODD_OR_EVEN,toParty} = JSON.parse(data))
		})
	}

}
	
	
	
	