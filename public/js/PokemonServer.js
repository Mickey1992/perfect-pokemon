class PokemonServer {
	login(authCode) {
		var server = this;
		return new Promise(function(resolve, reject) {
			$.ajax({
				url: "login",
				method: "post",
				dataType: "json",
				data: {googleAuthCode: authCode}
			})
			.done(function(data) {
				resolve(server.preprocessData(data));
			})
			.fail(function() {
				console.error(arguments);
				throw "Error happens while login";
			});
		});
	}

	refreshData() {
		var server = this;
		return new Promise(function(resolve, reject) {
			$.ajax({
				url: "refresh",
				dataType: "json",
			})
			.done(function(data) {
				if (data.expired) {
					//TODO: somehow this cannot be caught by Promise.catch, fix this bug
					throw "Client is expired, please login again";
				}
				resolve(server.preprocessData(data));
			});
		});
	}

	getData() {
		var server = this;
		return new Promise(function(resolve, reject) {
			$.ajax({
				url: "pogoData",
				dataType: "json"
			})
			.done(function(data) {
				resolve(server.preprocessData(data));
			});
		});
	}

	preprocessData(data) {
		data.pokemon.map(this.calculateIVPerfection.bind(this)).map(this.normalizeCreationTime.bind(this)).map(this.calculatePokemonLevel.bind(this));
		this.calculateLevelXP(data.player);
		return data;
	}

	calculateIVPerfection(pokemon) {
		var ivTotal = pokemon.individual_attack + pokemon.individual_defense + pokemon.individual_stamina;
		pokemon.iv_perfection = ((ivTotal) / 45 * 100).toFixed(2);
		return pokemon
	}

	calculatePokemonLevel(pokemon) {
		var initialLevel = pokemonLevelMaps[Math.round(pokemon.cp_multiplier * 100000) + ""];
		pokemon.level = initialLevel + pokemon.num_upgrades / 2;
		return pokemon
	}

	normalizeCreationTime(pokemon) {
		pokemon.caught_time = new Date(this.normalizeNumber(pokemon.creation_time_ms));
		return pokemon
	}

	calculateLevelXP(player) {
		player.current_level_xp = PLAYER_XP_FOR_EACH_LEVEL[player.level];
		player.current_level_earned_xp = player.current_level_xp - 
			(this.normalizeNumber(player.next_level_xp) - this.normalizeNumber(player.experience));
	}

	normalizeNumber(numberObj) {
		//`number >>> 0` will convert signed number to unsigner number, e.g. for `(-3).toString(2)`, you'll get `-11`.
		// but for `(-3 >>> 0).toString(2)`, you'll get its unsigned format value `11111111111111111111111111111101` 
		// Thanks http://stackoverflow.com/questions/16155592/negative-numbers-to-binary-string-in-javascript
		return parseInt((numberObj.high >>> 0).toString(16) + (numberObj.low >>> 0).toString(16), 16);
	}
}