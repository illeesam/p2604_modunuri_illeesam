package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyhAlarmSendHist;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyhAlarmSendHistRepository;

import java.time.LocalDateTime;

public interface SyhAlarmSendHistRepository extends JpaRepository<SyhAlarmSendHist, String>, QSyhAlarmSendHistRepository {

    long countBySendDateBefore(LocalDateTime cutoff);

    long deleteBySendDateBefore(LocalDateTime cutoff);
}
