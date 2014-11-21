var app = angular.module('pager', []);

app.controller("TeamController", function($scope) {

    function init_counts() {
	$scope.teamList = [];
//	$scope.scoreList = {}; // {"Team1": {"Team2":4, "Team3":8}, "Team2": {"Team1": 3}, "Team3": {"Team1":9}}
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

/*
    function addScore(team1, team2, score) {
	if (!(team1 in $scope.scoreList)) {
	    $scope.scoreList[team1] = {};
	}
	if (!(team2 in $scope.scoreList[team1])) {
	    $scope.scoreList[team1][team2] = 0;
	}
	
	var previous = $scope.scoreList[team1][team2];
	$scope.scoreList[team1][team2] = previous + Number(score);
    }
*/

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
//	    console.log("fractionize " + key + " sum: " + $scope.linkSum[key]);
	    $scope.fractions[key] = {};
	    for (team in $scope.linkCount[key] ) {
		if (!(team in $scope.fractions[key])) {
		    $scope.fractions[key][team] = {};
		}
		var n1 = Number($scope.linkCount[key][team]);
		var n2 = Number($scope.linkSum[key]);
		if (n2 == 0)
		    n2 = 1.0;
//		console.log ("fractionize " + key + " team "+ team + " %: " + (n1 / n2) + " (" + n1 + "/" + n2 +")" );
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

//	console.log("PR..........");

	var N = 40;
	for (iteration=0; iteration<N; iteration++) {
	    var sum = 0.0;
	    for (var i in $scope.teamList) {
		var key = $scope.teamList[i];
//		console.log("PR..." + iteration + " team: " + key);
		sum = 0.0;
		
		for (var team in $scope.backlinks[key]) {
		    sum = sum + ( $scope.pageRank[team] * $scope.fractions[team][key]);

//		    console.log("PR...  " + key + " " + team + " pr: " + $scope.pageRank[team] +"  fraction: "+ Number($scope.fractions[key][team]) + " sum: " + sum);
		    
		}
		var x = d1 + (d * sum);
//		console.log("PR("+ key +") is now " + x)
		$scope.pageRank[key] = x;
	    }
//	    console.log("PR " + iteration + " "+ JSON.stringify($scope.pageRank));
	}


/*
*/
	$scope.teamList.sort( function(a,b) {return a.team1 >= b.team1});

//	console.log("teamList " + JSON.stringify($scope.teamList));
//	console.log("linkSum " + JSON.stringify($scope.linkSum));
//	console.log("linkCount " + JSON.stringify($scope.linkCount));
//	console.log("backlinks " + JSON.stringify($scope.backlinks));
//	console.log("scoreList " + JSON.stringify($scope.scoreList));
//	console.log("fractions " + JSON.stringify($scope.fractions));
//	console.log("PR " + JSON.stringify($scope.pageRank));
	
	var keys = Object.keys($scope.pageRank);
//	keys.sort( function(a,b) {return a>b;});
	keys.sort( function(a,b) {return $scope.pageRank[a] <= $scope.pageRank[b];});

//	console.log("Keys " + JSON.stringify(keys));
	for (var k in keys ) {
	    var x = keys[k];
	    var daNum = (Math.round( $scope.pageRank[ x ] * 100) / 100);
//	    console.log( daNum + "," + x);
	    $scope.prList.push({team: x, pagerank: Number(daNum) });
	}

    });

});

