<?php
include('./buysellads.php');
$ad = Buysellads::getAd('CVADT27Y', 1);
$output = '<a href="'.$ad['ads'][0]['statlink'].'" class="cta" data-ga="textad" target="_blank">';
$output .= '<img src="'.Buysellads::decodeBase64($ad['ads'][0]['base64']).'" style="float: left;width: 60px;border: 1px solid #e1e1e1; border-radius: 2px;margin: 0 10px 0 0;" />';
$output .= '<strong>'.$ad['ads'][0]['title'].'</strong><br>'.$ad['ads'][0]['description'];
if(isset($ad['ads'][0]['pixel']))
	$output .= '<img src="'.$ad['ads'][0]['pixel'].'" alt="impression pixel" />';
$output .= '<div style="clear: both;width: 100%;display: block;"></div></a>';
?>
(function(){
window.blockFreeAd = "<?php echo addslashes($output); ?>";
})();
