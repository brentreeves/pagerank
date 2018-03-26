var app = angular.module('pager', []);

app.controller("TeamController", function($scope) {
    var keys = [];

    function d2(x) {
	return (Math.round( x * 100) / 100);
    }

    function dot(inArray) {
	// rankdir=LR;
	// remember the weights and add to assoc array by weight?
	// {rank=same, b,c,d} {rank=same, e,f,g}


	var ranks = '';
	for (var i=0; i< keys.length; i++) {
	    ranks += ' -> "' + keys[i] + '"';
	}
	ranks += ';';
	ranks = ranks.substr(3);

	console.log('Ranks: ' + ranks);

//	str = "digraph {\n";
	var labels = '';
	var ranks = {};
	for (var x in $scope.pageRank) {
	    var n2 = d2($scope.pageRank[x]);
	    if (!(n2 in ranks)) 
		ranks[n2] = [];
	    if (!(x in ranks[n2]))
		ranks[n2].push( x );
	    labels += ( "\"" + x + "\" [label=\"" + x + " (" + n2 + ")" + "\"];\n");
	}
	console.log("graph labels");
	console.log(JSON.stringify(ranks));

	var str = '';
	for (var x in inArray) {
	    for (var y in inArray[x]) {
		str += ( "\"" + x + "\"->\"" + y + "\";\n");
		// + "(" + $scope.pageRank[x] +")
	    }
	}
//	str += "}\n";
	return labels + str;
    }

    function init_counts() {
	keys = [];
	$scope.teamList = [];
	$scope.backlinks = {}; // who links to me?
	
	$scope.pageRank = {} // pagerank PR(A) = (1 - d) + d( PR(B)/ fraction(B->A), PR(C)/ fraction(C->A))
	$scope.linkCount = {};

	$scope.linkSum = {}; // sum of goals given up, i.e. gifted to others
	$scope.fractions = {};
	$scope.prList = [];
    }

/*
    function addScores(team1, team2, score1, score2) {
	addScore(team1, team2, score1);
	addScore(team2, team1, score2);
    }
*/

    function addLink(giver, receiver, score) {
	if (score == 0)
	    return;
	if (!(giver in $scope.linkSum))
	    $scope.linkSum[giver] = 0;
	$scope.linkSum[giver] = $scope.linkSum[giver] + Number(score);

	if (!(receiver in $scope.backlinks))
	    $scope.backlinks[receiver] = {};
	if (!(giver in $scope.backlinks[receiver]))
	    $scope.backlinks[receiver][giver] = score;

	if (!(giver in $scope.linkCount)) 
	    $scope.linkCount[giver] = {};
	if (!(receiver in $scope.linkCount[giver]))
	    $scope.linkCount[giver][receiver] = 0;
	$scope.linkCount[giver][receiver]= Number(score) + Number($scope.linkCount[giver][receiver]);
    }

    function addLinks(team1, team2, score1, score2) {
	addLink(team1, team2, score2);
	addLink(team2, team1, score1);
    }

    function addTeamName(team) {
	if ($scope.teamList.indexOf(team) == -1)
	    $scope.teamList.push(team)
    }

    init_counts();

    $scope.$watch("scoreData", function() {
        var lines, lineNumber, data, length;
	init_counts();
	
        lines = $scope.scoreData.split('\n');
        lineNumber = 0;
        for (var i=0; i < lines.length; i++) {
            l = lines[i].trim();
	    if (l == "")
		continue;
//	    console.log("splitting line "+ i+ " "+ lines[i]);
            
            lineNumber++;
            data = l.split(',');
            
            var team1 = data[0];
            var team2 = data[1];
            var score1 = data[2];
            var score2 = data[3];
            var date  = data[4];

	    addTeamName(team1);
	    addTeamName(team2);
//	    addScores(team1, team2, score1, score2);
	    addLinks(team1, team2, score1, score2);
	    
	    // $scope.teamList.push({ team1: team1, team2: team2, score1: score1, score2: score2, status: "happy"
        };

	// fractionize
//	console.log("fractionize");
	for (key in $scope.linkCount) {
	    console.log("fractionize " + key + " sum: " + $scope.linkSum[key]);
	    $scope.fractions[key] = {};
	    for (team in $scope.linkCount[key] ) {
		if (!(team in $scope.fractions[key])) {
		    $scope.fractions[key][team] = {};
		}
		var n1 = Number($scope.linkCount[key][team]);
		var n2 = Number($scope.linkSum[key]);
		if (n2 == 0)
		    n2 = 1.0;
		console.log ("fractionize [" + key + "] team ["+ team + "] %: " + (n1 / n2) + " (" + n1 + "/" + n2 +")" );
		$scope.fractions[key][team] = n1 / n2;
	    }
	}
	
	//
	// PR(A) = (1-d) + d (PR(T1)/C(T1) + ... + PR(Tn)/C(Tn))
	//
	// start PAGERANKE out at 1 for each page
	//
	var d = 0.85;
	var d1 = 1 - d;
	for (var i in $scope.teamList)
	    $scope.pageRank[ $scope.teamList[i]] = 1.0;

	console.log("PR -------------------------------------------------------------------.");
	console.log("pageRanks: " + JSON.stringify($scope.pageRank) );
	console.log("fractions: " + JSON.stringify($scope.fractions) );

	var N = 60;
	for (iteration=0; iteration<N; iteration++) {
	    var sum = 0.0;
	    for (var i in $scope.teamList) {
		var key = $scope.teamList[i];
//		console.log("PR..." + iteration + " team: " + key);
		sum = 0.0;
		
		for (var team in $scope.backlinks[key]) {
		    sum = sum + ( $scope.pageRank[team] * $scope.fractions[team][key] );

//		    console.log("PR...  key [" + key + "] team [" + team + "] pr: " + $scope.pageRank[team] +
//				"  fraction: "+ Number( $scope.fractions[team][key] ) + " sum: " + sum);
		    
		}
		var x = d1 + (d * sum);
//		console.log("PR("+ key +") is now " + x)
		$scope.pageRank[key] = x;
	    }
	    console.log("PR " + iteration + " "+ JSON.stringify($scope.pageRank));
	}


/*
*/
	$scope.teamList.sort( function(a,b) {return a.team1 >= b.team1});

//	console.log("teamList " + JSON.stringify($scope.teamList));
//	console.log("linkSum " + JSON.stringify($scope.linkSum));
//	console.log("linkCount " + JSON.stringify($scope.linkCount));
//	console.log("backlinks " + JSON.stringify($scope.backlinks));
//	console.log("fractions " + JSON.stringify($scope.fractions));
//	console.log("PR " + JSON.stringify($scope.pageRank));
	
	keys = Object.keys($scope.pageRank);
//	console.log("Keys before: " + JSON.stringify(keys) );
//	for (var kk in keys)
//	    console.log("kk: " + kk + " key: " + keys[kk] + " #: " + $scope.pageRank[ keys[kk] ] );

//	keys.sort( function(a,b) {return a>b;});
	keys.sort( function(a,b) {return Number( $scope.pageRank[b] ) - Number( $scope.pageRank[a]) ;});

//
//	console.log("Keys after : " + JSON.stringify(keys) );
//	for (var kk in keys)
//	    console.log("kk: " + kk + " key: " + keys[kk] + " #: " + $scope.pageRank[ keys[kk] ] );



//	console.log("Keys " + JSON.stringify(keys));
	for (var k in keys ) {
	    var x = keys[k];
	    var daNum = (Math.round( $scope.pageRank[ x ] * 100) / 100); // caution k vs x
//	    console.log( daNum + "," + x);
	    $scope.prList.push({team: x, pagerank: Number(daNum) });
	}

//	$scope.dot = dot($scope.backlinks);
	$scope.dot = dot($scope.fractions);

/*
  var container = document.getElementById('mynetwork');
  var data = {
    dot: 'dinetwork {node[shape=circle]; 1 -> 1 -> 2; 2 -> 3; 2 -- 4; 2 -> 1 }'
  };
  var network = new vis.Network(container, data);
*/
	var mygraph = document.getElementById('graph');
	var options = {
	    width: '100%',
	    height: '100%'
	};
	var data = {
//	    dot: 'dinetwork {node[shape=circle]; 1 -> 1 -> 2; 2 -> 3; 2 -- 4; 2 -> 1 }'
	    dot: 'dinetwork {' + $scope.dot + '}\n'
	}
	var network = new vis.Network(mygraph, data);
    });

});

