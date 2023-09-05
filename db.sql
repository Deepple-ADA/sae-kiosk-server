create database kiosk default character set utf8mb4 collate utf8mb4_unicode_ci;

create table kiosk.order (
    orderId integer unsigned not null primary key auto_increment,
    orderNumber integer unsigned not null,
    `date` date not null default now(),
    orderPlaced boolean not null default true,
    `timestamp` datetime not null default now()
);

create table kiosk.order_list (
    orderListId integer unsigned not null primary key auto_increment,
    orderId integer unsigned not null,
    menu varchar(100) not null,
    price integer not null,
    amount integer not null
);