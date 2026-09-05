package com.shopjoy.ecBeBo.md.cb.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.md.cb.data.dto.MdCbYarnDto;
import com.shopjoy.ecBeBo.md.cb.data.entity.MdCbYarn;
import com.shopjoy.ecBeBo.md.cb.repository.MdCbYarnRepository;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.util.PageHelper;
import com.shopjoy.ecBeBo.common.util.SecurityUtil;
import com.shopjoy.ecBeBo.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MdCbYarnService {

    private final MdCbYarnRepository mdCbYarnRepository;

    @PersistenceContext
    private EntityManager em;

    public MdCbYarnDto.Item getById(String id) {
        // [QueryDSL] 코바늘 실 마스터 단건 조회
        MdCbYarnDto.Item dto = mdCbYarnRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    public MdCbYarn findById(String id) {
        // [쿼리 메서드] 코바늘 실 마스터 단건 조회
        return mdCbYarnRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    public boolean existsById(String id) {
        // [쿼리 메서드] 코바늘 실 마스터 존재 여부 확인
        return mdCbYarnRepository.existsById(id);
    }

    public List<MdCbYarnDto.Item> getList(MdCbYarnDto.Request req) {
        // [QueryDSL] 코바늘 실 마스터 목록 조회
        return mdCbYarnRepository.selectList(req);
    }

    public BasePage<MdCbYarnDto.Item> getPageData(MdCbYarnDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 코바늘 실 마스터 페이지 조회
        return mdCbYarnRepository.selectPageData(req);
    }

    @Transactional
    public MdCbYarn create(MdCbYarn body) {
        body.setYarnId(CmUtil.generateId("cb_yarn"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 코바늘 실 마스터 저장
        MdCbYarn saved = mdCbYarnRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public MdCbYarn update(String id, MdCbYarn body) {
        CmUtil.requireId(id, "id", this);
        MdCbYarn entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "yarnId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 코바늘 실 마스터 저장
        MdCbYarn saved = mdCbYarnRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        MdCbYarn entity = findById(id);
        // [쿼리 메서드] 코바늘 실 마스터 삭제
        mdCbYarnRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveListBase(List<MdCbYarn> rows) {
        for (MdCbYarn row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getYarnId() == null || row.getYarnId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, MdCbYarn::getYarnId, "U", "yarnId", this);
        CmUtil.requireRowIds(rows, MdCbYarn::getYarnId, "D", "yarnId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream().filter(r -> "D".equals(r.getRowStatus())).map(MdCbYarn::getYarnId).toList();
        // [쿼리 메서드] 코바늘 실 마스터 조건별 삭제
        if (!deleteIds.isEmpty()) mdCbYarnRepository.deleteAllById(deleteIds);

        List<MdCbYarn> updateRows = rows.stream().filter(r -> "U".equals(r.getRowStatus())).toList();
        for (MdCbYarn row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 코바늘 실 마스터 선택적 필드 수정
            int affected = mdCbYarnRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getYarnId() + "::" + CmUtil.svcCallerInfo(this));
        }

        List<MdCbYarn> insertRows = rows.stream().filter(r -> "I".equals(r.getRowStatus())).toList();
        for (MdCbYarn row : insertRows) {
            row.setYarnId(CmUtil.generateId("cb_yarn"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 코바늘 실 마스터 저장
            mdCbYarnRepository.save(row);
        }

        em.flush();
        em.clear();
    }
}
