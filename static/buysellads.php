<?php

class Buysellads
{

    // Defaults to true.
    private static $testMode = false;

    // The base URL for the BuySellAds API.
    private static $apiBase = 'http://srv.buysellads.com/ads/';

    // The version of the BuySellAds API to use for requests.
    private static $apiVersion = 1;

    // TODO: you can shut down any use of cookie storage here
    private static $cookies = array();

    /**
     * @return array The ad request.
     */
    public static function getAd($zone, $qty, $segments = null, $encode = true)
    {
        $url = self::$apiBase.$zone.'.json?'.self::buildUrl($segments);

        // we probably need something to make sure file_get_contents is successful and retry if not...
        $data = json_decode(file_get_contents($url), true);

        $ad = $data;
        $ad['ads'][0]['base64'] = self::getBase46Image($data, 'image', $encode);

        if ( isset($ad['ads'][0]['html']) )
        	$html = json_decode($ad['ads'][0]['html'], true);
        	if(isset($html) && is_array($html))
        		$ad = array_merge($ad, $html);

        // if the ad we just dropped has a freq cap we
        // need to update the freqcap cookie
        self::servingCallback($ad['ads'][0]['bannerid'], $ad['ads'][0]['zonekey'], @$ad['ads'][0]['freqcap']);

        return $ad;
    }

    /**
     * Builds the URL for the ad query.
     *
     * @param array $array
     */
    public static function buildUrl($segments)
    {
    	if(self::$testMode != false)
    		$array['ignore'] = 'yes';

    	$array['forwardedip'] = self::getIpAddress();

    	// mirroring pro.js variables
    	$force = htmlspecialchars(@$_GET['bsaproforce']);
    	$ignore = htmlspecialchars(@$_GET['bsaproignore']);
    	$nostats = htmlspecialchars(@$_GET['bsaprostats']);
    	$ignoretarg = htmlspecialchars(@$_GET['bsaproignoretargeting']);
    	$maxp = htmlspecialchars(@$_GET['bsapromaxp']);
    	$preview = htmlspecialchars(@$_GET['bsapreview']);

		if($force)
			$array['forcebanner'] = $force;
    	if($ignore)
    		$array['ignorebanner'] = $ignore;
    	if($ignoretarg)
	    	$array['ignoretargeting'] = 'yes';
    	if($maxp)
    		$array['maxpriority'] = $maxp;
    	// this is possible to be set in two places
    	// either at the top of this class or in the URL string
    	if($nostats)
    		$array['ignore'] = 'yes';

    	// TODO: handle "preview" somehow
    	if(is_array($segments))
    		$array['segment'] = implode(';', $segments);

    	$array = array_merge($array, self::getCookies(self::$cookies));

    	return urldecode(http_build_query($array));
    }

    private static function getCookies($cookies)
    {
    	$result = array();
		for ($i=0; $i<count($cookies); $i++)
			if(isset($_COOKIE[$cookies[$i]]))
				$result[$cookies[$i]] = $_COOKIE[$cookies[$i]];

    	return $result;
    }

    private static function servingCallback($banner, $zone, $freqcap)
    {
    	if($freqcap)
    	{
    		self::appendCookie('_bsap_daycap', $banner, 1);
    		self::appendCookie('_bsap_lifecap', $banner, 365);
    	}
    	return;
    }

    private static function appendCookie($which, $data, $days)
    {
    	if(isset($_COOKIE[$which]))
    		$data .= ','.str_replace('%2C', ',', $_COOKIE[$which]);

    	return setcookie($which, substr($data, 0, 2000), time()+($days*86400), '/');
    }

    public static function getBase46Image($data, $which, $encode) {

    	if ( isset($data['ads'][0][$which]) )
    		$image = $data['ads'][0][$which];
    	elseif ( isset($data['ads'][0]['html']) )
    	{
    		$html = json_decode($data['ads'][0]['html'], true);
    		if ( isset($html) )
    			$image = $html[$which];
    	}

    	// TODO: we should have proper ssl support detection here
    	//$image = preg_replace('/^https:/i', 'http:', $image);
    	$image = parse_url($image, PHP_URL_SCHEME) === null ? 'http:' . $image : $image;
    	$image = preg_replace('/^https:/i', 'http:', $image);

    	if(isset($image) && $encode)
	    	return gzencode('data:image;base64,'.base64_encode(file_get_contents($image)));
	    elseif(isset($image))
	    	return 'data:image;base64,'.base64_encode(file_get_contents($image));
	    else
			return false;
    }

    static function getIPAddress() {
    	return isset($_GET['ip']) ? $_GET['ip'] : $_SERVER['REMOTE_ADDR'];
    }

    public static function decodeBase64($data)
    {
       return gzinflate(substr($data,10,-8));
    }

}
