package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyhAlarmSendHist;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhAlarmSendHistRepository;

import java.time.LocalDateTime;

public interface SyhAlarmSendHistRepository extends JpaRepository<SyhAlarmSendHist, String>, QSyhAlarmSendHistRepository {

    long countBySendDateBefore(LocalDateTime cutoff);

    long deleteBySendDateBefore(LocalDateTime cutoff);
}
