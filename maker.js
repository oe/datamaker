$(function  ($) {
	var data = {};
	var parser = {
		tableName: '',
		sqltype: '',
		neededLen: 0,
		pks:[],//primary keys
		fields:{},//{'user_id':{'type':'i','typeinfo':'interger','nonull':true}}
		parse: function (sql,checktype) {
			this.__initParams();
			sql = sql.split('\n');
			var tmp,
				str,
				segs = [],
				len,
				i,
				j;
			checktype = checktype || false;
			//get CREATE statement's body
			for (i = 0, j = sql.length; i < j; ++i) {
				//trim a line
				tmp = $.trim(sql[i]);
				//remove line is empty or with comment
				if (tmp && (0 !== tmp.indexOf('--'))) {
					// remove comment(after a statement) of a field & the comma
					tmp = $.trim(tmp.split('--')[0]);
					len = tmp.length;
					if (',' === tmp[len-1]) {
						tmp = $.trim(tmp.substr(0,len-1));
					}
					//break when reach the end of create statement
					if (0 === tmp.indexOf(')')) {
						break;
					} else {
						segs.push(tmp);
					}
				}
			}
			//a correct create statement has at least 3 lines(in fact it's 4)
			len = segs.length;
			if (len < 3) {
				return 'Parse Failed:SQL Statement is not well formated!';
			}
			//first line should be 'CREATE TABLE', table name is in it
			tmp = segs[0].split(' ');
			if ((tmp.length === 3) && ('CREATE' == tmp[0])) {
				if (tmp[2]) {
					this.tableName = tmp[2];
				}else{
					return 'Parse Failed:Cannot find table name!';
				}
			}else{
				return 'Parse Failed:Cannot find "CREATE" statement!';
			}
			if (segs[1] != '(') {
				this.tableName = '';
				return 'Parse Failed:SQL Statement is not well formated(cannot find "(")!';
			}
			//find primary keys
			if (0 === segs[len-1].indexOf('CONSTRAINT')) {
				tmp = segs[len-1];
				i = tmp.indexOf('(');
				j = tmp.indexOf(')');
				if ((i === -1) || (j === -1) || (i > j)) {
					return 'Parse Failed:Cannot find primary key!';
				}
				tmp = $.trim(tmp.substring(i+1,j));
				if ('' === tmp) {
					return 'Parse Failed:SQL syntax error(primary key is empty)';
				}
				tmp = tmp.split(',');
				for (i = 0, j = tmp.length; i < j; ++i) {
					this.pks.push($.trim(tmp[i]));
				}
				--len;
			}
			// parse sql fields
			for (i = 2; i < len; ++i) {
				str = segs[i];
				j = str.indexOf('NOT NULL');
				//NOT NULL or can be NULL
				if (j === -1) {
					j = false;
				} else {
					str = $.trim(str.substring(0,j));
					j = true;
					++this.neededLen;
				}
				str = str.split(' ');
				if (str.length < 2) {
					this.__initParams();
					return 'Parse Failed:SQL syntax error in "' + segs[i] + '"';
				}
				str[0] = str[0].replace(/(^")|("$)/g,'');
				this.fields[str[0]] = {};
				if (j) {
					this.fields[str[0]]['nonull'] = true;
				}
				if (checktype) {
					switch(str[1]) {
						case 'smallint':
						case 'integer':
						case 'bigint':
							this.fields[str[0]]['type'] = 'i'; // i for interger
							break;
						case 'boolean':
							this.fields[str[0]]['type'] = 'b'; // b for boolean
							break;
						case 'character':
						case 'text':
							this.fields[str[0]]['type'] = 'c'; // c for string
							break;
						case 'timestamp':
							this.fields[str[0]]['type'] = 't'; // t for time
							break;
						case 'date':
							this.fields[str[0]]['type'] = 'd'; // t for date
							break;
						default:
							this.__initParams();
							return 'Parse Failed: field type of "' + str[1] + '" is not in the data type list, please report it to me. Thanks!';
					}
				}
				j = str[0];
				str.splice(0,1);
				this.fields[j]['typeinfo'] = str.join(' ');
			}
			for (i = 0, j = this.pks.length; i < j; ++i) {
				if (!this.fields[this.pks[i]]) {
					this.__initParams();
					return 'Parse Failed: It seems to be that primary keys are not in fields!';
				}
			}
			return true;
		},
		__initParams: function () {
			this.tableName = '';
			this.sqltype = '';
			this.pks = [];
			this.fields = {};
			this.neededLen = 0;
		}
	};

	$('#sql-placeholder').on('click',function  () {
		$(this).hide();
		$('#sqldiv').focus();
	});

	$('#sqldiv').on('blur',function  () {
		var sql = $(this).val();
		if ('' === sql) {
			$('#sql-placeholder').show();
		}
	});

	$('#analyze').on('click',function  () {
		var sql = $('#sqldiv').val();
		$('.sql-btns button').removeClass('active');
		$('#form-btns').addClass('hide');
		if (sql) {
			sql = parser.parse(sql,true);
			if (true !== sql) {
				alert(sql);
				$('.sql-btns button').attr('disabled',true);
			} else {
				initFields ();
				$('#sql-form .control-group').remove();
				$('.sql-btns button').attr('disabled',false);
			}
		} else {
			alert('NO SQL Statements');
			$('.sql-btns button').attr('disabled',true);
		}
		$(this).attr('disabled',false);
		$('#btn-script').attr('disabled',false);
	});

	$('#btn-form-insert,#btn-form-delete,#btn-form-select').on('click',function  () {
		$('.sql-btns button').removeClass('active');
		parser.sqltype = $(this).text();
		$(this).addClass('active');
		$('#form-btns').removeClass('hide');
		sqlInsertForm (true);
	});

	$('#btn-from-update').on('click',function  () {
		$('.sql-btns button').removeClass('active');
		parser.sqltype = $(this).text();
		$(this).addClass('active');
		$('#form-btns').removeClass('hide');
		sqlUpdateForm ();
	});

	$('#btn-script').on('click',function  () {
		var sql = $('#sqldiv').val();
		$('.sql-btns button').removeClass('active');
		$('#form-btns').addClass('hide');
		if (sql) {
			parser.sqltype = 'Sqlstr';
			var param = [];
			param.push('sql=' + sql);
			param.push('__action=' + parser.sqltype);
			$('#sql-form .control-group').remove();
			request(param.join('&'));
		} else {
			$('#sql-placeholder').click();
		}
	});

	$('#sql-form').on('submit',function  () {
		var param = [];
		param.push($(this).serialize());
		param.push('__action=' + parser.sqltype);
		param.push('__table_name=' + parser.tableName);
		request(param.join('&'));
		return false;
	});

	$('#sql-form').on('click','.delete',function  () {
		$(this).parents('.control-group').remove();
		if($('#sql-form .control-group').length === 0){
			$('#form-btns').addClass('hide');
		}
	});

	function initFields () {
		$('#fields').html('');
		var k,str;
		for (k in parser.fields) {
			str = '<li value="' + k + '" ';
			if (parser.fields[k].type) {
				str += 'data="' + parser.fields[k].type + '" ';
			}
			str += '>' + k ;
			if (parser.fields[k].nonull) {
				str += '<b>*</b>';
			}
			str += '<i>' + parser.fields[k].typeinfo + '</i></li>';
			$('#fields').append(str);
		}
		for (k in parser.pks) {
			str = parser.pks[k];
			$('#fields li[value="' + str + '"]').append('<i>(pk)</i>');
		}
	}

	function sqlInsertForm (putAllFields) {
		$('#input-data').html('');
		putAllFields = putAllFields || false;
		var k,
			str = '';
		if (putAllFields) {
			for (k in parser.fields) {
				str += getInputControl(k);
			}
			$('#input-data').append(str);
		} else {
			for (k in parser.fields) {
				if (parser.fields[k].nonull) {
					str += getInputControl(k);
				}
				$('#input-data').append(str);
			}
		}
	}

	function sqlUpdateForm () {
		$('#input-data').html('<div class="tips">Drag field in right to here to add data you wanna update.</div>');
		$('#input-condition').html('<div class="tips">Drag field in right to here to add condition of which entry you wanna update.</div>');
		if (parser.pks.length) {
			$('#input-condition').html('');
			var str = '',
				k;
			for (k in parser.pks) {
				str += getInputControl(parser.pks[k],'condition');
			}
			$('#input-condition').append(str);
		}
	}

	function getInputControl (field,prefix) {
		var str = '',
			validate = '';
		if ( !parser.fields[field] ) {
			return str;
		}
		prefix = prefix || '';
		str = '<div class="control-group">';
		str += '<label class="control-label" for="'+ prefix + field + '">';
		str += field;
		if (parser.fields[field].nonull) {
			str += '<b>*</b>';
			validate += 'required ';
		}
		if (parser.fields[field].type) {
			validate += parser.fields[field].type;
		}
		str += '</label>';
		str += '<div class="controls">';
		if (prefix) {
			str += '<input type="text" name="' + prefix + '[' + field + ']" id="' + prefix + field + '" ';
		} else {
			str += '<input type="text" name="' + field + '" id="' + prefix + field + '" ';
		}
		str += 'validate="' + validate + '">';
		str += '<span class="help-inline">' + parser.fields[field].typeinfo + '</span>';
		str += '<span class="delete">X</span>';
		str += '</div></div>';
		return str;
	}

	function request (data,callback,method) {
		method = method || 'post';
		$.ajax({
			url: 'action.php',
			type: method,
			dataType: "json",
			data: data,
			success: function  (ret) {
				if (callback) {
					callback.call(ret);
				} else {
					if (ret.result) {
						alert(parser.sqltype + ' success!' + (ret.msg ? '\n' + ret.msg : ''));
						if (ret.entries) {
							$('#input-data').html('');
							var str,i;
							str = '<ol>';
							for (i in ret.entries) {
								str += '<li>' + JSON.stringify(ret.entries[i]) + '</li>';
							}
							str += '</ol>';
							$('#input-data').append(str);
						}
					} else {
						alert(parser.sqltype + ' failed!\nmessage:' + ret.msg);
					}
				}
			},
			error: function  (XMLHttpRequest, textStatus, errorThrown) {
				alert(textStatus);
			}
		});
	}

});
