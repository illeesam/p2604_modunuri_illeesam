package com.shopjoy.ecadminapi.base.ec.dp.repository;

import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUi;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpUiRepository;

public interface DpUiRepository extends JpaRepository<DpUi, String>, QDpUiRepository {
}
