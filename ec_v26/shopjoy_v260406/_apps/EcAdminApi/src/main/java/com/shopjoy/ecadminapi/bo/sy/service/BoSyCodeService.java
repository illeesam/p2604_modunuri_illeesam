package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCode;
import com.shopjoy.ecadminapi.base.sy.mapper.SyCodeMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyCodeRepository;
import com.shopjoy.ecadminapi.cache.redisstore.SyCodeRedisStore;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BoSyCodeService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final SyCodeMapper      syCodeMapper;
    private final SyCodeRepository  syCodeRepository;
    private final SyCodeRedisStore  codeCache;
    @PersistenceContext
    private EntityManager em;

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<SyCodeDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return syCodeMapper.selectList(p);
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<SyCodeDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(syCodeMapper.selectPageList(p), syCodeMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** getById — 조회 */
    @Transactional(readOnly = true)
    public SyCodeDto getById(String id) {
        SyCodeDto dto = syCodeMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    /** create — 생성 */
    @Transactional
    public SyCode create(SyCode body) {
        body.setCodeId("CD" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyCode saved = syCodeRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        codeCache.evictAll();
        return saved;
    }

    /** update — 수정 */
    @Transactional
    public SyCodeDto update(String id, SyCode body) {
        SyCode entity = syCodeRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopy(body, entity, "codeId", "regBy", "regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyCode saved = syCodeRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        codeCache.evictAll();
        return getById(id);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        SyCode entity = syCodeRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syCodeRepository.delete(entity);
        em.flush();
        if (syCodeRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
        codeCache.evictAll();
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<SyCode> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getCodeId() != null)
            .map(SyCode::getCodeId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syCodeRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        // 2단계: UPDATE 처리
        List<SyCode> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getCodeId() != null)
            .toList();
        for (SyCode row : updateRows) {
            SyCode entity = syCodeRepository.findById(row.getCodeId())
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + row.getCodeId()));
            VoUtil.voCopy(row, entity, "codeId", "regBy", "regDate");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syCodeRepository.save(entity);
        }
        em.flush();

        // 3단계: INSERT 처리
        List<SyCode> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyCode row : insertRows) {
            row.setCodeId("CD" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syCodeRepository.save(row);
        }
        em.flush();
        em.clear();
        codeCache.evictAll();
    }
}