<?php


function getFolderAudio($folder) {
	$audioList = array();
	if (is_dir($folder) && $folder = opendir($folder)) {
		while (false !== ($file = readdir($folder))) {
			$file = iconv( "iso-8859-1", "utf-8", $file);
			$explode = explode(".", $file);
			$ext = end($explode);
			if ($file != '.' && $file != '..' && ($ext == "mp3" || $ext == "m4a")) array_push($audioList, $file);
		}
	}
	return $audioList;
}



if (isset($_GET["world"]) && preg_match("/^([^\/\?\:\\\"\<\>\*\|]+)$/", $_GET["world"])) {
	$folder = "../audio/worlds/" . $_GET["world"] . "/";
	$audio = getFolderAudio($folder);
	if (sizeof($audio) > 0) {
		header("Content-type: application/json");
		echo json_encode($audio);
	}
	else echo json_encode(array());
}
else echo json_encode(array());