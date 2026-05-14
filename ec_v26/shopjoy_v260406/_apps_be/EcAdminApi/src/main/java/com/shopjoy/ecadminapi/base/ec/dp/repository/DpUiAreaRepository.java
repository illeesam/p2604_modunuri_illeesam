package com.shopjoy.ecadminapi.base.ec.dp.repository;

import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUiArea;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpUiAreaRepository;

public interface DpUiAreaRepository extends JpaRepository<DpUiArea, String>, QDpUiAreaRepository {
}
