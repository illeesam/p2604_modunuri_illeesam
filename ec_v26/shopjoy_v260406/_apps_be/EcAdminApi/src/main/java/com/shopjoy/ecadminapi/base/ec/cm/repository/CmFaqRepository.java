package com.shopjoy.ecadminapi.base.ec.cm.repository;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmFaq;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmFaqRepository;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CmFaqRepository extends JpaRepository<CmFaq, String>, QCmFaqRepository {
}
