<?php /* Smarty version Smarty-3.1.19, created on 2014-10-29 16:33:01
         compiled from "/home/mikeraic/public_html/store-demo/modules/blockcategories/views/blockcategories_admin.tpl" */ ?>
<?php /*%%SmartyHeaderCode:53797165854514efd396070-97701914%%*/if(!defined('SMARTY_DIR')) exit('no direct access allowed');
$_valid = $_smarty_tpl->decodeProperties(array (
  'file_dependency' => 
  array (
    'a89695c2a525344d0102759ed70fe2bb9c33658c' => 
    array (
      0 => '/home/mikeraic/public_html/store-demo/modules/blockcategories/views/blockcategories_admin.tpl',
      1 => 1414609500,
      2 => 'file',
    ),
  ),
  'nocache_hash' => '53797165854514efd396070-97701914',
  'function' => 
  array (
  ),
  'variables' => 
  array (
    'helper' => 0,
  ),
  'has_nocache_code' => false,
  'version' => 'Smarty-3.1.19',
  'unifunc' => 'content_54514efd39efb5_91028746',
),false); /*/%%SmartyHeaderCode%%*/?>
<?php if ($_valid && !is_callable('content_54514efd39efb5_91028746')) {function content_54514efd39efb5_91028746($_smarty_tpl) {?>
<div class="form-group">
	<label class="control-label col-lg-3">
		<span class="label-tooltip" data-toggle="tooltip" data-html="true" title="" data-original-title="<?php echo smartyTranslate(array('s'=>'You can upload a maximum of 3 images.','mod'=>'blockcategories'),$_smarty_tpl);?>
">
			<?php echo smartyTranslate(array('s'=>'Thumbnails','mod'=>'blockcategories'),$_smarty_tpl);?>

		</span>
	</label>
	<div class="col-lg-4">
		<?php echo $_smarty_tpl->tpl_vars['helper']->value;?>

	</div>
</div>
<?php }} ?>
