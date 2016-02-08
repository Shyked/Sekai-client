<?php

require_once 'myPDO.class.php';

myPDO::setConfiguration('mysql:host=legtux.org;dbname=shyked;charset=utf8','shyked','riia_06prj');

$pdo = myPDO::getInstance();