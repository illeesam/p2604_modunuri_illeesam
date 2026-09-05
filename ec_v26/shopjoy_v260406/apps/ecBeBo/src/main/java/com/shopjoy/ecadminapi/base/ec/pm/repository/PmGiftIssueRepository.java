package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGiftIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmGiftIssueRepository;

public interface PmGiftIssueRepository extends JpaRepository<PmGiftIssue, String>, QPmGiftIssueRepository {
}
