<?php /* Smarty version Smarty-3.1.19, created on 2014-10-29 15:00:36
         compiled from "/home/mikeraic/public_html/store-demo/admin123/themes/default/template/content.tpl" */ ?>
<?php /*%%SmartyHeaderCode:177764445654513954552b91-26318318%%*/if(!defined('SMARTY_DIR')) exit('no direct access allowed');
$_valid = $_smarty_tpl->decodeProperties(array (
  'file_dependency' => 
  array (
    '8440abb2a9a33ca7aa3f41f24c7adee2245fa62f' => 
    array (
      0 => '/home/mikeraic/public_html/store-demo/admin123/themes/default/template/content.tpl',
      1 => 1406835656,
      2 => 'file',
    ),
  ),
  'nocache_hash' => '177764445654513954552b91-26318318',
  'function' => 
  array (
  ),
  'variables' => 
  array (
    'content' => 0,
  ),
  'has_nocache_code' => false,
  'version' => 'Smarty-3.1.19',
  'unifunc' => 'content_5451395455c3b4_00710024',
),false); /*/%%SmartyHeaderCode%%*/?>
<?php if ($_valid && !is_callable('content_5451395455c3b4_00710024')) {function content_5451395455c3b4_00710024($_smarty_tpl) {?>
<div id="ajax_confirmation" class="alert alert-success hide"></div>

<div id="ajaxBox" style="display:none"></div>


<div class="row">
	<div class="col-lg-12">
		<?php if (isset($_smarty_tpl->tpl_vars['content']->value)) {?>
			<?php echo $_smarty_tpl->tpl_vars['content']->value;?>

		<?php }?>
	</div>
</div><?php }} ?>
