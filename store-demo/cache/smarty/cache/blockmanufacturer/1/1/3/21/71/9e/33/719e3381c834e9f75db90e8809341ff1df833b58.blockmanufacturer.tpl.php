<?php /*%%SmartyHeaderCode:7435514755451509ca565e5-21415922%%*/if(!defined('SMARTY_DIR')) exit('no direct access allowed');
$_valid = $_smarty_tpl->decodeProperties(array (
  'file_dependency' => 
  array (
    '719e3381c834e9f75db90e8809341ff1df833b58' => 
    array (
      0 => '/home/mikeraic/public_html/store-demo/themes/default-bootstrap/modules/blockmanufacturer/blockmanufacturer.tpl',
      1 => 1406835656,
      2 => 'file',
    ),
  ),
  'nocache_hash' => '7435514755451509ca565e5-21415922',
  'version' => 'Smarty-3.1.19',
  'unifunc' => 'content_545173ee0352e9_99687625',
  'has_nocache_code' => false,
  'cache_lifetime' => 31536000,
),true); /*/%%SmartyHeaderCode%%*/?>
<?php if ($_valid && !is_callable('content_545173ee0352e9_99687625')) {function content_545173ee0352e9_99687625($_smarty_tpl) {?>
<!-- Block manufacturers module -->
<div id="manufacturers_block_left" class="block blockmanufacturer">
	<p class="title_block">
					<a href="http://mikerai.com/store-demo/en/manufacturers" title="Manufacturers">
						Manufacturers
					</a>
			</p>
	<div class="block_content list-block">
								<ul>
														<li class="last_item">
						<a 
						href="http://mikerai.com/store-demo/en/1_fashion-manufacturer" title="More about Fashion Manufacturer">
							Fashion Manufacturer
						</a>
					</li>
												</ul>
										<form action="/store-demo/index.php" method="get">
					<div class="form-group selector1">
						<select class="form-control" name="manufacturer_list">
							<option value="0">All manufacturers</option>
													<option value="http://mikerai.com/store-demo/en/1_fashion-manufacturer">Fashion Manufacturer</option>
												</select>
					</div>
				</form>
						</div>
</div>
<!-- /Block manufacturers module -->
<?php }} ?>
