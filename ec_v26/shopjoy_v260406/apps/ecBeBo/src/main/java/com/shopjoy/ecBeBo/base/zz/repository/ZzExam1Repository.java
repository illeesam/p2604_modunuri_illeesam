package com.shopjoy.ecBeBo.base.zz.repository;

import com.shopjoy.ecBeBo.base.zz.data.entity.ZzExam1;
import com.shopjoy.ecBeBo.base.zz.repository.qrydsl.QZzExam1Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ZzExam1Repository extends JpaRepository<ZzExam1, String>, QZzExam1Repository {
}
