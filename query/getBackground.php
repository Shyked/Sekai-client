<?php


function getFolderImages($folder) {
	$imgList = array();
	if (is_dir($folder) && $folder = opendir($folder)) {
		while (false !== ($file = readdir($folder))) {
			$file = iconv( "iso-8859-1", "utf-8", $file);
			$explode = explode(".", $file);
			$ext = end($explode);
			if ($file != '.' && $file != '..' && ($ext == "png" || $ext == "jpg" || $ext == "jpeg")) array_push($imgList, $file);
		}
	}
	return $imgList;
}

function sendEmpty() {
	header("Content-type: application/json");
	echo json_encode(array(
		"size" => array(
			"x" => 0,
			"y" => 0
		),
		"images" => array()
	));
}

if (isset($_GET["world"]) && preg_match("/^([^\/\?\:\\\"\<\>\*\|]+)$/", $_GET["world"])) {
	$folder = "../img/worlds/" . $_GET["world"] . "/background/";
	$imgs = getFolderImages($folder);
	if (sizeof($imgs) > 0) {
		asort($imgs);
		$imgsSort = array();
		foreach ($imgs as $val) {
			array_push($imgsSort, $val);
		}
		$filename = "background.json";
		if (file_exists($folder . $filename)) {
			$file = fopen($folder . $filename,"r");
			$json = fread($file,filesize($folder . $filename));
			fclose($file);
			$bgData = json_decode($json);
			if (isset($bgData->size)) {
				$bgData->images = $imgsSort;
				header("Content-type: application/json");
				echo json_encode($bgData);
			}
			else sendEmpty();
		}
		else sendEmpty();
	}
	else sendEmpty();
}
else sendEmpty();