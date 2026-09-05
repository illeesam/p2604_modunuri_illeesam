package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyAlarm;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyAlarmRepository;


public interface SyAlarmRepository extends JpaRepository<SyAlarm, String>, QSyAlarmRepository {

}
