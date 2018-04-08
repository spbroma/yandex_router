delayedCntr = 0;



function buttonClick(){
	// console.log('buttonClick');
	flagSet('1');

}

function getCurrentTime()
{
	var d = new Date(); // for now
	dStr = '' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + '.' + d.getMilliseconds();
	return dStr;
}

function flagState(){
	return document.getElementById('flag').valueOf().innerHTML;
}
function flagSet(val){
	return document.getElementById('flag').valueOf().innerHTML = val;
}

function delayedAlert() {
	delayedCntr++;
	str = '' + delayedCntr;
  setTimeout(delayedFunc, 1000);
}

function delayedFunc(){
	delayedCntr++;
	console.log('delayedFunc ' + delayedCntr);
}

function dispStr(name, str){
	// resultDOM = document.getElementsById(name);
	// resultDOM[0].innerHTML  = str;
	resultDOM = document.getElementById(name);
	resultDOM.innerHTML  = str;
}

function timeout() {
    setTimeout(function () {
		delayedCntr++;
		console.log('delayedFunc ' + delayedCntr);
        timeout();
    }, 1000);
}

function mydelay(d){
	a = 0;
	for (var i = 0; i < d; i++) {
		for (var j = 0; j < d; j++) {
			for (var k = 0; k < d; k++) {
				a++;
			}	
		}
	}
}


function initiateTimeOut(i) {
  setTimeout(function() { doStuff(i) }, 30);
}
function doStuff(i) {
    console.log(i);
    i++;
    if (i <= 10) {
        initiateTimeOut(i); 
    }
}

function init () {

	// timeout();

	// for (var i = 0; i < 10; i++) {
	// 	mydelay(400);
	// 	console.log(i);
	// }

	var targetCoords = [55.848527, 37.583103],

	myMap = new ymaps.Map('map', {
	    center: targetCoords,
	    zoom: 11
	}, {
	    // Ограничиваем количество результатов поиска.
	    searchControlResults: 1,

	    // Отменяем автоцентрирование к найденным адресам.
	    searchControlNoCentering: true
	}),

	currentRoute,

	sourceCoordsArr,

	targetPoint,

	heatmap;

	// ymaps.modules.require(['Heatmap'], function (Heatmap) {
	// 	var data = [[55.848527, 37.583103], [55.848528, 37.583104]],
 //        heatmap = new Heatmap(data);
 //     	heatmap.setMap(myMap);
	// });

	metricArr = [];
	var sourceCoordsArrLength;

	nextMetricFlag = 1;

	sourceCoordsArrIndex = 0;

	myMap.events.add('click', onMapClick);


	function clearTargetPoint () {
        if (targetPoint) {
            myMap.geoObjects.remove(targetPoint);
            targetPoint = null;
        }
    }

    function evalMetric(source, target){
    	var currentRoute = new ymaps.multiRouter.MultiRoute(
    	{
    		referencePoints: [source, target],
    		params: { routingMode: 'masstransit'},
    	});

    	currentRoute.events.add("activeroutechange", function (event) {
    		// mydelay(400);
    		nextMetricFlag = 1;
    		var routes = currentRoute.getRoutes();
    		var resultStr = '';
    		var durationArr = [];
    		for (var i = 0; i<routes.getLength(); i++)
    		{
    			var duration_text=routes.get(i).properties.get('duration.text');
    			var duration_val=routes.get(i).properties.get('duration.value');
    			durationArr[i] = duration_val;	

    			var walkDist = routes.get(i).properties.get('rawProperties.RouteMetaData.WalkingDistance.value');
    			var walkDur = walkDist/5000*60;

    			resultStr += duration_text + '<br>';	

    			// console.log(duration_text + ' ' + walkDur);		

    		}

			var minVal = Math.min.apply(null, durationArr)/60;	

			metric = Math.round(minVal);
	    	metricArr.push(metric);	
	    	proc = Math.round(metricArr.length / sourceCoordsArrLength * 100);
	    	console.log('' + getCurrentTime() + '\t' + metricArr.length+' ' + metric);
	    	procStr = '';
	    	procStr += proc + '% ';
	    	// procStr += proc + '% ' + metric;
	    	dispStr('result', procStr);
	    	if(metricArr.length == sourceCoordsArrLength){
	    		plotHeatMap();
	    	}
	    	else{
	    		if((sourceCoordsArrIndex % 100) == 0){
	    			// mydelay(1300); //1200 = ~16s
	    		}
	    		else{
		    		delayVal = Math.round(Math.random()*400 + 200);
		    		// mydelay(delayVal);
	    		}
	    		evalMetric(sourceCoordsArr[sourceCoordsArrIndex++], targetCoords);


	    		console.log('' + getCurrentTime() + '\t' +sourceCoordsArrIndex+' waitig..');
	    	}

	    	// myMap.geoObjects.add(currentRoute);
		});
    }

    function plotHeatMap(){

		minMetric = Math.min.apply(null, metricArr);
		normMetric = [];
    	for (var i = 0; i < sourceCoordsArrLength; i++) {
    		normMetric.push(metricArr[i] - minMetric + 1)
    		console.log([i, normMetric[i]]);
    	}

    	str = '';
    	for (var i = 0; i < sourceCoordsArrLength; i++) {
    		str += '[' + sourceCoordsArr[i] + ',' + normMetric[i] + ']\n';
    	}
    	console.log(str);

    	heatMapData = [];
    	var cntr = 0;
    	while(cntr < sourceCoordsArrLength){
    		for (var i = 0; i < normMetric[cntr]; i++) {
    			heatMapData.push(sourceCoordsArr[cntr]);
    		}
    		cntr++;
    	}

    	// for (var i = 0; i < heatMapData.length; i++) {
    	// 	console.log(heatMapData[i]);
    	// }

		ymaps.modules.require(['Heatmap'], function (Heatmap) {
			// var data = [[55.848527, 37.583103], [55.848528, 37.583104]],
	        heatmap = new Heatmap(heatMapData);
	        heatmap.options.set('radius', 20);
	     	heatmap.setMap(myMap);
		});
    }

    function evalCoordinates(targetCoords){
    	c = targetCoords;
 		
 		sourceCoordsArr = [];

 		step = 1000;
        R = 4000;
 		// N = 9;

 		// step = R*2/((N-1)*2);
 		// step = R*2/((N-1)*2);
 		N = R/step + 1;



 		dcx = ymaps.coordSystem.geo.solveDirectProblem(c, [1,0], step);
 		dcy = ymaps.coordSystem.geo.solveDirectProblem(c, [0,1], step);

 		dcx = dcx.endPoint[0] - c[0];
 		dcy = dcy.endPoint[1] - c[1];

 		for(var i = -N; i <= N; i++){
 			for(var j = -N; j <= N; j++){    
                if((Math.pow(i,2) + Math.pow(j,2)) < Math.pow(N,2)){
                	if(!((i== 0) && (j== 0)))
                	{
						x = c[0] + i*dcx;
						y = c[1] + j*dcy;
						sourceCoordsArr.push([x, y]);                        
                	}
                }
 			}
 		} 		
 		return sourceCoordsArr;
    }

    function onMapClick (e) {
    	metricArr = [];
	    clearTargetPoint();
	    targetCoords = e.get('coords');
	    targetPoint = new ymaps.Placemark(targetCoords, { iconContent: '' }, { preset: 'islands#blueCircleIcon' });
	    myMap.geoObjects.add(targetPoint);
	    console.log(['onMapClick', targetCoords]);

	    // Generate source coordinates
	    // targetCoords = [55.848527, 37.583103]; // DEBUG!
	    sourceCoordsArr = evalCoordinates(targetCoords);
	    sourceCoordsArrLength = sourceCoordsArr.length;
	    
	    str = '' + sourceCoordsArrLength + ' точек';

	    dispStr('points', str);

	    // Show source points
	    // for(var i=0; i<sourceCoordsArr.length; i++){
	    // 	sourceCoords = sourceCoordsArr[i];
	    // 	sourcePoint = new ymaps.Placemark(sourceCoords, { iconContent: '' }, { preset: 'islands#redCircleIcon' });
	    // 	myMap.geoObjects.add(sourcePoint);
	    // }

	    // Eval metric

	    timeoutCntr = 0;
	    // for (var i=0;i<=sourceCoordsArr.length;i++) {
	    // // for (var i=0;i<=100;i++) {
	    // //    (function(ind) {
	    // //        setTimeout(function(){
	    //        	// mydelay(400);
	           	
	    //        	evalMetric(sourceCoordsArr[i], targetCoords);
	    //        	console.log(timeoutCntr++);
	    //    //     }, (100 * ind));
	    //    // })(i);
	    // }

	    // var i = 0;
	    // while(i<sourceCoordsArr.length){
	    // 	mydelay(400);
	    // 	if(flagState() == '1'){
	    // 		i++;
	    // 		evalMetric(sourceCoordsArr[i], targetCoords);
	    // 		flagSet('0');
	    // 	}

	    // }


	    // for(var i=0; i<sourceCoordsArr.length; i++){
	    // 	if(nextMetricFlag){
	    // 		nextMetricFlag = 0;
	    // 		evalMetric(sourceCoordsArr[i], targetCoords);
	    // 	}
	    // }


	    evalMetric(sourceCoordsArr[sourceCoordsArrIndex++], targetCoords);
		// var i = 0;
	 //    while(i<sourceCoordsArr.length){
	 //    	console.log(i);
	 //    	mydelay(500);
	 //    	if(nextMetricFlag){
	 //    		nextMetricFlag = 0;
	 //    		i++;
	 //    		evalMetric(sourceCoordsArr[i], targetCoords);
	 //    	}
	 //    }

	}


}
ymaps.ready(init);