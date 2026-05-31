package com.shopjoy.ecadminapi.base.ec.dp.repository;

import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpUiRepository;

import java.util.List;

public interface DpUiRepository extends JpaRepository<DpUi, String>, QDpUiRepository {

}
