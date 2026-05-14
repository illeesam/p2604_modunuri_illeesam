package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.ZzSample1Dto;
import com.shopjoy.ecadminapi.base.sy.data.entity.ZzSample1;
import com.shopjoy.ecadminapi.base.sy.repository.ZzSample1Repository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ZzSample1Service {

    private final ZzSample1Repository zzSample1Repository;

    @PersistenceContext
    private EntityManager em;

    /** getById — 조회 */
    public ZzSample1Dto.Item getById(String id) {
        ZzSample1Dto.Item dto = zzSample1Repository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public ZzSample1Dto.Item getByIdOrNull(String id) {
        return zzSample1Repository.selectById(id).orElse(null);
    }

    /** findById — 엔티티 조회 */
    public ZzSample1 findById(String id) {
        return zzSample1Repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public ZzSample1 findByIdOrNull(String id) {
        return zzSample1Repository.findById(id).orElse(null);
    }

    /** existsById — 존재 확인 */
    public boolean existsById(String id) {
        return zzSample1Repository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!zzSample1Repository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /** getList — 조회 */
    public List<ZzSample1Dto.Item> getList(ZzSample1Dto.Request req) {
        return zzSample1Repository.selectList(req);
    }

    /** getPageData — 조회 */
    public ZzSample1Dto.PageResponse getPageData(ZzSample1Dto.Request req) {
        PageHelper.addPaging(req);
        return zzSample1Repository.selectPageList(req);
    }

    /** create — 생성 */
    @Transactional
    public ZzSample1 create(ZzSample1 body) {
        body.setSample1Id(CmUtil.generateId("zz_sample1"));
        body.setRgtr(SecurityUtil.getAuthUser().authId());
        body.setRegDt(LocalDate.now());
        body.setMdfr(SecurityUtil.getAuthUser().authId());
        body.setMdfcnDt(LocalDate.now());
        ZzSample1 saved = zzSample1Repository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return saved;
    }

    /** save — 저장 (단건) */
    @Transactional
    public ZzSample1 save(ZzSample1 entity) {
        if (entity.getSample1Id() == null || !zzSample1Repository.existsById(entity.getSample1Id()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSample1Id() + "::" + CmUtil.svcCallerInfo(this));
        entity.setMdfr(SecurityUtil.getAuthUser().authId());
        entity.setMdfcnDt(LocalDate.now());
        return zzSample1Repository.save(entity);
    }

    /** update — 수정 */
    @Transactional
    public ZzSample1 update(String id, ZzSample1 body) {
        ZzSample1 entity = zzSample1Repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        VoUtil.voCopyExclude(body, entity, "sample1Id^rgtr^regDt");
        entity.setMdfr(SecurityUtil.getAuthUser().authId());
        entity.setMdfcnDt(LocalDate.now());
        ZzSample1 saved = zzSample1Repository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /** updateSelective — 부분 수정 (selective) */
    @Transactional
    public int updateSelective(ZzSample1 entity) {
        return zzSample1Repository.updateSelective(entity);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        ZzSample1 entity = zzSample1Repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        zzSample1Repository.delete(entity);
        em.flush();
        if (zzSample1Repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList — 일괄 저장 */
    @Transactional
    public void saveList(List<ZzSample1> rows) {
        zzSample1Repository.saveAll(rows);
    }
}
