<?php /* Smarty version Smarty-3.1.19, created on 2014-10-29 16:21:18
         compiled from "/home/mikeraic/public_html/store-demo/modules/blocksharefb/blocksharefb.tpl" */ ?>
<?php /*%%SmartyHeaderCode:2936837454514c3e10fe38-19840369%%*/if(!defined('SMARTY_DIR')) exit('no direct access allowed');
$_valid = $_smarty_tpl->decodeProperties(array (
  'file_dependency' => 
  array (
    '28d4467867833d9353ad0417fa9f1bee45ff0a0e' => 
    array (
      0 => '/home/mikeraic/public_html/store-demo/modules/blocksharefb/blocksharefb.tpl',
      1 => 1414613939,
      2 => 'file',
    ),
  ),
  'nocache_hash' => '2936837454514c3e10fe38-19840369',
  'function' => 
  array (
  ),
  'variables' => 
  array (
    'product_link' => 0,
    'product_title' => 0,
  ),
  'has_nocache_code' => false,
  'version' => 'Smarty-3.1.19',
  'unifunc' => 'content_54514c3e119a97_16175146',
),false); /*/%%SmartyHeaderCode%%*/?>
<?php if ($_valid && !is_callable('content_54514c3e119a97_16175146')) {function content_54514c3e119a97_16175146($_smarty_tpl) {?>

<li id="left_share_fb">
	<a href="http://www.facebook.com/sharer.php?u=<?php echo $_smarty_tpl->tpl_vars['product_link']->value;?>
&amp;t=<?php echo $_smarty_tpl->tpl_vars['product_title']->value;?>
" class="_blank"><?php echo smartyTranslate(array('s'=>'Share on Facebook!','mod'=>'blocksharefb'),$_smarty_tpl);?>
</a>
</li><?php }} ?>
